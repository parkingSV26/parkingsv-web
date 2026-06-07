import "server-only";

import {
  defaultPreferences,
  normalizePreferences,
  type ParkingPreferences,
} from "@/app/settings/_lib/preferences";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { formatSupabaseErrorForLog } from "@/src/lib/supabase/errors";

export async function getUserPreferences(authUserId: string) {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.getUserById(authUserId);

    if (error) {
      throw error;
    }

    const candidate = data.user?.user_metadata?.preferences;
    if (!candidate || typeof candidate !== "object") {
      return defaultPreferences;
    }

    return normalizePreferences(candidate as Partial<Record<string, unknown>>);
  } catch (error) {
    console.warn("Failed to load user preferences.", formatSupabaseErrorForLog(error));
    return defaultPreferences;
  }
}

export async function saveUserPreferences(authUserId: string, preferences: ParkingPreferences) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(authUserId);

  if (error) {
    throw error;
  }

  const nextMetadata = {
    ...(data.user?.user_metadata ?? {}),
    preferences,
  };

  const { error: updateError } = await admin.auth.admin.updateUserById(authUserId, {
    user_metadata: nextMetadata,
  });

  if (updateError) {
    throw updateError;
  }
}
