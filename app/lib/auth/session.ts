import type { User } from "@supabase/supabase-js";
import { getPublicUserByEmail, upsertPublicUserProfile } from "@/app/lib/auth/user-profile";
import { type UserType } from "@/app/lib/auth/user-types";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { formatSupabaseErrorForLog } from "@/src/lib/supabase/errors";

const DEFAULT_AVATAR = "/parkingsv/default-avatar.jpeg";
const LEGACY_UPLOAD_PREFIX = "/crud-php2/public/uploads/";

export type SessionUser = {
  authUserId: string;
  id: number;
  fullName: string;
  email: string;
  dateOfBirth: string | null;
  userType: UserType;
  profilePicture: string;
  phoneNumber: string | null;
  emailVerified: boolean;
};

function resolveProfilePicture(profilePicture: string | null) {
  if (!profilePicture) {
    return DEFAULT_AVATAR;
  }

  if (profilePicture.startsWith(LEGACY_UPLOAD_PREFIX)) {
    return `/legacy-assets/${profilePicture.slice(LEGACY_UPLOAD_PREFIX.length)}`;
  }

  if (profilePicture.startsWith("/crud-php2/assets/images/")) {
    return DEFAULT_AVATAR;
  }

  return profilePicture;
}

function mapSessionUser(authUser: User, publicUser: Awaited<ReturnType<typeof getPublicUserByEmail>>): SessionUser | null {
  if (!publicUser) {
    return null;
  }

  return {
    authUserId: authUser.id,
    email: publicUser.email,
    dateOfBirth: publicUser.dateOfBirth,
    emailVerified: publicUser.emailVerified,
    fullName: publicUser.fullName,
    id: publicUser.id,
    phoneNumber: publicUser.phoneNumber,
    profilePicture: resolveProfilePicture(publicUser.profilePicture),
    userType: publicUser.userType,
  };
}

export async function clearUserSession() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
}

export async function getSessionUser() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !authUser?.email) {
      return null;
    }

    let publicUser = await getPublicUserByEmail(authUser.email);

    if (!publicUser) {
      try {
        publicUser = await upsertPublicUserProfile({
          authUser,
          email: authUser.email,
          emailVerified: Boolean(authUser.email_confirmed_at),
        });
      } catch (bootstrapError) {
        console.warn(
          "Failed to bootstrap public user profile.",
          formatSupabaseErrorForLog(bootstrapError),
        );
        return null;
      }
    }

    return mapSessionUser(authUser, publicUser);
  } catch (error) {
    if (error instanceof Error && /Dynamic server usage/i.test(error.message)) {
      return null;
    }

    console.warn("Failed to resolve session user.", formatSupabaseErrorForLog(error));
    return null;
  }
}
