import "server-only";

import { requireEnv } from "@/src/lib/env";

const DEFAULT_SITE_URL = "http://localhost:3000";

export function getSupabaseServiceRoleKey() {
  return requireEnv(process.env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY");
}

export function getAvatarBucketName() {
  return process.env.SUPABASE_AVATARS_BUCKET?.trim() || "avatars";
}

export function getParkingBucketName() {
  return process.env.SUPABASE_PARKINGS_BUCKET?.trim() || "parkings";
}

export function getSiteUrl() {
  return process.env.SITE_URL?.trim() || DEFAULT_SITE_URL;
}

export function buildSiteUrl(pathname: string) {
  return new URL(pathname, getSiteUrl()).toString();
}
