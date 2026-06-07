import { getSessionUser } from "@/app/lib/auth/session";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ notificationId: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getSessionUser();

  if (!user) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  const { notificationId } = await params;
  const payload = (await request.json()) as { isRead?: boolean };

  if (typeof payload.isRead !== "boolean") {
    return Response.json({ error: "Estado invalido." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("notifications")
    .update({ is_read: payload.isRead })
    .eq("id", Number(notificationId))
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to update notification.", error);
    return Response.json({ error: "No se pudo actualizar la notificacion." }, { status: 500 });
  }

  return Response.json({ success: true });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const user = await getSessionUser();

  if (!user) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  const { notificationId } = await params;
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("notifications")
    .delete()
    .eq("id", Number(notificationId))
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to delete notification.", error);
    return Response.json({ error: "No se pudo eliminar la notificacion." }, { status: 500 });
  }

  return Response.json({ success: true });
}
