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
    // The current schema may not include the table in Supabase yet; metadata is still the immediate source.
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
    // If the table does not exist in Supabase yet, the user's metadata preserves the real state.
  }
}
