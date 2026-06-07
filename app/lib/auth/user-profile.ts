import { randomUUID } from "node:crypto";
import type { User } from "@supabase/supabase-js";
import { hashPassword, verifyPassword } from "@/app/lib/auth/password";
import { normalizeUserType, type UserType } from "@/app/lib/auth/user-types";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { formatSupabaseErrorForLog } from "@/src/lib/supabase/errors";

export type PublicUserProfile = {
  businessName: string | null;
  dateOfBirth: string | null;
  email: string;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  fullName: string;
  id: number;
  latitude: number | null;
  longitude: number | null;
  passwordHash: string | null;
  phoneNumber: string | null;
  profilePicture: string | null;
  userType: UserType;
};

type PublicUserRow = {
  business_name: string | null;
  date_of_birth: string | null;
  email: string;
  email_verified: number | null;
  email_verified_at: string | null;
  full_name: string;
  id: number;
  latitude: number | null;
  longitude: number | null;
  password_hash: string | null;
  phone_number: string | null;
  profile_picture: string | null;
  user_type: string | null;
};

type UpsertPublicUserInput = {
  authUser?: User | null;
  email: string;
  dateOfBirth?: string | null;
  emailVerified?: boolean;
  fullName?: string;
  passwordHash?: string;
  phoneNumber?: string | null;
  profilePicture?: string | null;
  userType?: UserType;
};

type UpdatePublicUserProfileInput = {
  businessName?: string | null;
  dateOfBirth?: string | null;
  email?: string;
  emailVerified?: boolean;
  fullName?: string;
  phoneNumber?: string | null;
  profilePicture?: string | null;
  userType?: UserType;
};

type AuthUserBootstrapInput = {
  dateOfBirth?: string | null;
  email: string;
  fullName: string;
  password: string;
  userType: UserType;
};

function mapPublicUser(row: PublicUserRow): PublicUserProfile {
  return {
    businessName: row.business_name,
    dateOfBirth: row.date_of_birth,
    email: row.email,
    emailVerified: Boolean(row.email_verified),
    emailVerifiedAt: row.email_verified_at,
    fullName: row.full_name,
    id: row.id,
    latitude: row.latitude,
    longitude: row.longitude,
    passwordHash: row.password_hash,
    phoneNumber: row.phone_number,
    profilePicture: row.profile_picture,
    userType: normalizeUserType(row.user_type),
  };
}

function readMetadataString(user: User | null | undefined, key: string) {
  const value = user?.user_metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function findAuthUserByEmail(email: string) {
  const admin = createSupabaseAdminClient();
  const normalizedEmail = email.trim().toLowerCase();
  let page = 1;

  for (let attempts = 0; attempts < 20; attempts += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) {
      throw error;
    }

    const match = (data.users ?? []).find(
      (user) => user.email?.trim().toLowerCase() === normalizedEmail,
    );

    if (match) {
      return match;
    }

    if (!data.nextPage || data.nextPage <= page) {
      return null;
    }

    page = data.nextPage;
  }

  return null;
}

function buildFallbackName(email: string) {
  const localPart = email.split("@")[0] ?? "usuario";
  const normalized = localPart
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return "Usuario Parking SV";
  }

  return normalized
    .split(" ")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

export async function getPublicUserByEmail(email: string) {
  try {
    const admin = createSupabaseAdminClient();
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await admin
      .from("users")
      .select(
        "id, full_name, email, password_hash, profile_picture, phone_number, date_of_birth, business_name, user_type, latitude, longitude, email_verified, email_verified_at",
      )
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (error) {
      console.warn("Failed to load public user by email.", formatSupabaseErrorForLog(error));
      return null;
    }

    return data ? mapPublicUser(data as PublicUserRow) : null;
  } catch (error) {
    console.warn("Unexpected error while loading public user by email.", formatSupabaseErrorForLog(error));
    return null;
  }
}

export async function getPublicUserById(userId: number) {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("users")
      .select(
        "id, full_name, email, password_hash, profile_picture, phone_number, date_of_birth, business_name, user_type, latitude, longitude, email_verified, email_verified_at",
      )
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.warn("Failed to load public user by id.", formatSupabaseErrorForLog(error));
      return null;
    }

    return data ? mapPublicUser(data as PublicUserRow) : null;
  } catch (error) {
    console.warn("Unexpected error while loading public user by id.", formatSupabaseErrorForLog(error));
    return null;
  }
}

export async function upsertPublicUserProfile(input: UpsertPublicUserInput) {
  const admin = createSupabaseAdminClient();
  const normalizedEmail = input.email.trim().toLowerCase();
  const existing = await getPublicUserByEmail(normalizedEmail);
  const emailVerified =
    input.emailVerified ??
    (input.authUser?.email_confirmed_at ? true : undefined) ??
    existing?.emailVerified ??
    false;
  const userType =
    input.userType ??
    normalizeUserType(
      readMetadataString(input.authUser, "user_type") ?? existing?.userType ?? "customer",
    );
  const fullName =
    input.fullName ??
    readMetadataString(input.authUser, "full_name") ??
    existing?.fullName ??
    buildFallbackName(normalizedEmail);
  const passwordHash =
    input.passwordHash ??
    existing?.passwordHash ??
    (await hashPassword(randomUUID()));

  const basePayload = {
    business_name: existing?.businessName ?? null,
    date_of_birth: input.dateOfBirth ?? existing?.dateOfBirth ?? null,
    email: normalizedEmail,
    email_verified: emailVerified ? 1 : 0,
    email_verified_at:
      emailVerified
        ? input.authUser?.email_confirmed_at ?? existing?.emailVerifiedAt ?? new Date().toISOString()
        : null,
    full_name: fullName,
    password_hash: passwordHash,
    phone_number: input.phoneNumber ?? existing?.phoneNumber ?? null,
    profile_picture: input.profilePicture ?? existing?.profilePicture ?? null,
    user_type: userType,
  };

  if (existing) {
    const { error } = await admin.from("users").update(basePayload).eq("id", existing.id);

    if (error) {
      throw error;
    }

    return getPublicUserById(existing.id);
  }

  const { data, error } = await admin
    .from("users")
    .insert(basePayload)
    .select(
      "id, full_name, email, password_hash, profile_picture, phone_number, date_of_birth, business_name, user_type, latitude, longitude, email_verified, email_verified_at",
    )
    .single();

  if (error) {
    throw error;
  }

  return mapPublicUser(data as PublicUserRow);
}

export async function updatePublicUserProfileById(
  userId: number,
  input: UpdatePublicUserProfileInput,
) {
  const admin = createSupabaseAdminClient();
  const existing = await getPublicUserById(userId);

  if (!existing) {
    return null;
  }

  const normalizedEmail = (input.email ?? existing.email).trim().toLowerCase();
  const fullName = input.fullName ?? existing.fullName;
  const phoneNumber =
    input.phoneNumber !== undefined ? input.phoneNumber?.trim() ?? null : existing.phoneNumber;
  const dateOfBirth =
    input.dateOfBirth !== undefined ? input.dateOfBirth?.trim() ?? null : existing.dateOfBirth;
  const businessName =
    input.businessName !== undefined ? input.businessName?.trim() ?? null : existing.businessName;
  const profilePicture =
    input.profilePicture !== undefined ? input.profilePicture : existing.profilePicture;
  const userType = input.userType ?? existing.userType;
  const emailVerified =
    input.emailVerified ?? existing.emailVerified ?? Boolean(existing.emailVerifiedAt);

  const duplicate = await getPublicUserByEmail(normalizedEmail);

  if (duplicate && duplicate.id !== userId) {
    throw new Error("Ya existe una cuenta con ese correo.");
  }

  const { error } = await admin
    .from("users")
    .update({
      business_name: businessName,
      date_of_birth: dateOfBirth,
      email: normalizedEmail,
      email_verified: emailVerified ? 1 : 0,
      email_verified_at:
        emailVerified ? existing.emailVerifiedAt ?? new Date().toISOString() : null,
      full_name: fullName,
      password_hash: existing.passwordHash,
      phone_number: phoneNumber,
      profile_picture: profilePicture,
      user_type: userType,
    })
    .eq("id", userId);

  if (error) {
    throw error;
  }

  return getPublicUserById(userId);
}

export async function createOrConfirmAuthUser(input: AuthUserBootstrapInput) {
  const admin = createSupabaseAdminClient();
  const normalizedEmail = input.email.trim().toLowerCase();
  const metadata = {
    date_of_birth: input.dateOfBirth?.trim() || null,
    full_name: input.fullName.trim(),
    user_type: input.userType,
  };
  const existingAuthUser = await findAuthUserByEmail(normalizedEmail);

  if (existingAuthUser) {
    const existingMetadata =
      typeof existingAuthUser.user_metadata === "object" && existingAuthUser.user_metadata !== null
        ? (existingAuthUser.user_metadata as Record<string, unknown>)
        : {};

    const { data, error } = await admin.auth.admin.updateUserById(existingAuthUser.id, {
      email_confirm: true,
      password: input.password,
      user_metadata: {
        ...existingMetadata,
        ...metadata,
      },
    });

    if (error) {
      throw error;
    }

    return data.user;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true,
    password: input.password,
    user_metadata: metadata,
  });

  if (error) {
    throw error;
  }

  return data.user;
}

export async function createLegacyAuthUserIfNeeded(email: string, password: string) {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const publicUser = await getPublicUserByEmail(normalizedEmail);

    if (!publicUser?.passwordHash) {
      return {
        created: false,
        publicUser: null as PublicUserProfile | null,
        requiresConfirmation: false,
      };
    }

    const passwordMatches = await verifyPassword(password, publicUser.passwordHash);

    if (!passwordMatches) {
      return {
        created: false,
        publicUser: null as PublicUserProfile | null,
        requiresConfirmation: false,
      };
    }

    await createOrConfirmAuthUser({
      dateOfBirth: publicUser.dateOfBirth,
      email: normalizedEmail,
      fullName: publicUser.fullName,
      password,
      userType: publicUser.userType,
    });

    return { created: true, publicUser, requiresConfirmation: false };
  } catch (error) {
    console.warn("Unexpected error while migrating legacy auth user.", formatSupabaseErrorForLog(error));
    return {
      created: false,
      publicUser: null as PublicUserProfile | null,
      requiresConfirmation: false,
    };
  }
}
