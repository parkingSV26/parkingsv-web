import "server-only";

import { getSupabaseAnonKey, getSupabaseUrl } from "@/src/lib/supabase/public";

const SUPABASE_CONNECTION_ERROR_MESSAGE =
  "No se pudo conectar con Supabase. Verifica que la URL del proyecto sea correcta y que el proyecto siga activo.";

export async function ensureSupabaseAuthReachable() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(new URL("/auth/v1/health", getSupabaseUrl()), {
      headers: {
        apikey: getSupabaseAnonKey(),
        Authorization: `Bearer ${getSupabaseAnonKey()}`,
      },
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });

    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function getSupabaseConnectionErrorMessage() {
  return SUPABASE_CONNECTION_ERROR_MESSAGE;
}
