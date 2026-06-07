import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "@/src/lib/supabase/public";
import { getSupabaseServiceRoleKey } from "@/src/lib/supabase/server-env";

export function createSupabaseAdminClient() {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
