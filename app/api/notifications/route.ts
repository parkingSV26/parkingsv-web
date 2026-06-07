import { getSessionUser } from "@/app/lib/auth/session";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function PATCH() {
  const user = await getSessionUser();

  if (!user) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("Failed to mark notifications as read.", error);
    return Response.json({ error: "No se pudieron actualizar las notificaciones." }, { status: 500 });
  }

  return Response.json({ success: true });
}
