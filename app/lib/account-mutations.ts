import "server-only";

import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";

type AuthMetadata = Record<string, unknown>;

export async function readAuthMetadata(authUserId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(authUserId);

  if (error) {
    throw error;
  }

  return (data.user?.user_metadata ?? {}) as AuthMetadata;
}

export async function updateAuthMetadata(authUserId: string, metadata: AuthMetadata) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(authUserId, {
    user_metadata: metadata,
  });

  if (error) {
    throw error;
  }
}

export async function syncVehicleSelections(userId: number, vehicleIds: number[]) {
  const admin = createSupabaseAdminClient();

  try {
    const { error: deleteError } = await admin.from("user_vehicles").delete().eq("user_id", userId);

    if (deleteError) {
      throw deleteError;
    }

    if (vehicleIds.length > 0) {
      const { error: insertError } = await admin.from("user_vehicles").insert(
        vehicleIds.map((vehicleId) => ({
          user_id: userId,
          vehicle_type_id: vehicleId,
        })),
      );

      if (insertError) {
        throw insertError;
      }
    }
  } catch {
    // El esquema actual puede no incluir la tabla en Supabase todavía; metadata sigue siendo la fuente inmediata.
  }
}

export async function syncSpecificationSelections(
  userId: number,
  specifications: Array<{ id: number; value: string }>,
) {
  const admin = createSupabaseAdminClient();

  try {
    const { error: deleteError } = await admin
      .from("user_specifications")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      throw deleteError;
    }

    if (specifications.length > 0) {
      const { error: insertError } = await admin.from("user_specifications").insert(
        specifications.map((specification) => ({
          specification_type_id: specification.id,
          user_id: userId,
          value: specification.value === "" ? null : specification.value,
        })),
      );

      if (insertError) {
        throw insertError;
      }
    }
  } catch {
    // Si la tabla aún no existe en Supabase, la metadata del usuario conserva el estado real.
  }
}
