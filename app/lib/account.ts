import "server-only";

import type { SessionUser } from "@/app/lib/auth/session";
import { getPublicUserById } from "@/app/lib/auth/user-profile";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { formatSupabaseErrorForLog } from "@/src/lib/supabase/errors";

const DEFAULT_AVATAR = "/parkingsv/default-avatar.jpeg";
const LEGACY_UPLOAD_PREFIX = "/crud-php2/public/uploads/";

type VehicleTypeRow = {
  category_name: string;
  description: string;
  icon: string;
  id: number;
};

type UserVehicleRow = {
  vehicle_type_id: number;
};

type UserSpecificationTypeRow = {
  description: string;
  has_value: boolean | number | null;
  icon: string;
  id: number;
  name: string;
  value_label: string | null;
};

type UserSpecificationRow = {
  specification_type_id: number;
  value: string | number | null;
};

type AuthMetadata = {
  user_specifications?: Record<string, string | null>;
  vehicle_type_ids?: number[];
};

export type AccountVehicle = {
  categoryName: string;
  description: string;
  icon: string;
  id: number;
};

export type VehicleOption = {
  categoryName: string;
  description: string;
  icon: string;
  id: number;
};

export type AccountSpecification = {
  description: string;
  hasValue: boolean;
  icon: string;
  id: number;
  isActive: boolean;
  name: string;
  value: string;
  valueLabel: string | null;
};

export type AccountPageData = {
  allVehicleTypes: VehicleOption[];
  locationText: string;
  specifications: AccountSpecification[];
  user: {
    dateOfBirth: string | null;
    email: string;
    fullName: string;
    id: number;
    latitude: number | null;
    longitude: number | null;
    phoneNumber: string | null;
    profilePicture: string;
    userType: "customer" | "owner";
  };
  userVehicles: AccountVehicle[];
};

const FALLBACK_SPECIFICATION_TYPES: Array<Omit<AccountSpecification, "isActive" | "value">> = [
  {
    description: "Personas con movilidad reducida",
    hasValue: false,
    icon: "wheelchair",
    id: 1,
    name: "Discapacitad@ a bordo",
    valueLabel: null,
  },
  {
    description: "Conductor de servicio de taxi",
    hasValue: false,
    icon: "taxi",
    id: 2,
    name: "Conductor/a de Taxi",
    valueLabel: null,
  },
  {
    description: "Mujeres embarazadas",
    hasValue: false,
    icon: "person-pregnant",
    id: 3,
    name: "Futura mama a bordo",
    valueLabel: null,
  },
  {
    description: "Transporta mascotas regularmente",
    hasValue: false,
    icon: "paw",
    id: 4,
    name: "Mascotas a bordo",
    valueLabel: null,
  },
  {
    description: "Vehiculo con motorizacion electrica",
    hasValue: false,
    icon: "charging-station",
    id: 5,
    name: "Vehiculo electrico",
    valueLabel: null,
  },
  {
    description: "Altura maxima del vehiculo",
    hasValue: true,
    icon: "ruler-vertical",
    id: 6,
    name: "Altura del vehiculo",
    valueLabel: "metros",
  },
];

export function resolveAccountProfilePicture(profilePicture: string | null) {
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

function mapVehicle(vehicle: VehicleTypeRow): AccountVehicle {
  return {
    categoryName: vehicle.category_name,
    description: vehicle.description,
    icon: vehicle.icon,
    id: vehicle.id,
  };
}

function formatLocationText(latitude: number | null, longitude: number | null) {
  if (latitude === null || longitude === null) {
    return "No has compartido tu ubicacion aun";
  }

  return `Lat: ${latitude}, Long: ${longitude}`;
}

async function getAuthMetadata(authUserId: string) {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.getUserById(authUserId);

    if (error) {
      throw error;
    }

    return (data.user?.user_metadata ?? {}) as AuthMetadata;
  } catch (error) {
    console.warn("Failed to load auth metadata.", formatSupabaseErrorForLog(error));
    return {};
  }
}

async function getVehicleOptions() {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("vehicle_types")
      .select("id, category_name, icon, description")
      .order("id", { ascending: true });

    if (error) {
      throw error;
    }

    return ((data ?? []) as VehicleTypeRow[]).map(mapVehicle);
  } catch (error) {
    console.warn("Failed to load vehicle options.", formatSupabaseErrorForLog(error));
    return [];
  }
}

async function getSelectedVehicleIds(userId: number, metadata: AuthMetadata) {
  const admin = createSupabaseAdminClient();

  try {
    const { data, error } = await admin
      .from("user_vehicles")
      .select("vehicle_type_id")
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    const ids = ((data ?? []) as UserVehicleRow[]).map((row) => row.vehicle_type_id);
    if (ids.length > 0) {
      return ids;
    }
  } catch {
    // The current Supabase project may not have these tables yet; use real metadata as a fallback.
  }

  return Array.isArray(metadata.vehicle_type_ids)
    ? metadata.vehicle_type_ids.filter((value): value is number => Number.isInteger(value))
    : [];
}

async function getSpecificationTemplates() {
  const admin = createSupabaseAdminClient();

  try {
    const { data, error } = await admin
      .from("user_specification_types")
      .select("id, name, icon, description, has_value, value_label")
      .order("id", { ascending: true });

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as UserSpecificationTypeRow[];
    if (rows.length > 0) {
      return rows.map((row) => ({
        description: row.description,
        hasValue: Boolean(row.has_value),
        icon: row.icon,
        id: row.id,
        name: row.name,
        valueLabel: row.value_label,
      }));
    }
  } catch {
    // If the table does not exist in Supabase yet, keep the catalog functional with the expected domain set.
  }

  return FALLBACK_SPECIFICATION_TYPES;
}

async function getSpecificationValues(userId: number, metadata: AuthMetadata) {
  const admin = createSupabaseAdminClient();

  try {
    const { data, error } = await admin
      .from("user_specifications")
      .select("specification_type_id, value")
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    const valueMap = new Map<string, string>();
    for (const row of (data ?? []) as UserSpecificationRow[]) {
      const rawValue = row.value;

      if (rawValue === null || rawValue === undefined) {
        valueMap.set(String(row.specification_type_id), "1");
        continue;
      }

      valueMap.set(String(row.specification_type_id), String(rawValue));
    }

    if (valueMap.size > 0) {
      return valueMap;
    }
  } catch {
    // As with vehicles, if the schema is still incomplete we use the user's metadata.
  }

  const metadataValues = metadata.user_specifications ?? {};
  return new Map(
    Object.entries(metadataValues)
      .filter((entry): entry is [string, string | null] => typeof entry[0] === "string")
      .map(([key, value]) => [key, value ?? "1"]),
  );
}

export async function getAccountPageData(sessionUser: SessionUser): Promise<AccountPageData | null> {
  const [publicUser, authMetadata, allVehicleTypes, specificationTemplates] = await Promise.all([
    getPublicUserById(sessionUser.id),
    getAuthMetadata(sessionUser.authUserId),
    getVehicleOptions(),
    getSpecificationTemplates(),
  ]);

  if (!publicUser) {
    return null;
  }

  const [selectedVehicleIds, specificationValues] = await Promise.all([
    getSelectedVehicleIds(sessionUser.id, authMetadata),
    getSpecificationValues(sessionUser.id, authMetadata),
  ]);

  const userVehicles = allVehicleTypes.filter((vehicle) => selectedVehicleIds.includes(vehicle.id));
  const specifications = specificationTemplates.map((template) => {
    const rawValue = specificationValues.get(String(template.id)) ?? "";
    const value = rawValue === "1" && !template.hasValue ? "" : rawValue;
    const isActive = rawValue !== "";

    return {
      ...template,
      isActive,
      value,
    };
  });

  return {
    allVehicleTypes,
    locationText: formatLocationText(publicUser.latitude, publicUser.longitude),
    specifications,
    user: {
      dateOfBirth: publicUser.dateOfBirth,
      email: publicUser.email,
      fullName: publicUser.fullName,
      id: publicUser.id,
      latitude: publicUser.latitude,
      longitude: publicUser.longitude,
      phoneNumber: publicUser.phoneNumber?.trim() ?? null,
      profilePicture: resolveAccountProfilePicture(publicUser.profilePicture),
      userType: publicUser.userType,
    },
    userVehicles,
  };
}
