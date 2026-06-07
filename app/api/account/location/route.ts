import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { getSessionUser } from "@/app/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as {
      latitude?: unknown;
      longitude?: unknown;
    };

    const latitude = Number(payload.latitude);
    const longitude = Number(payload.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return Response.json({ error: "Datos de ubicacion invalidos." }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from("users")
      .update({ latitude, longitude })
      .eq("id", user.id);

    if (error) {
      throw error;
    }

    return Response.json({
      locationText: `Lat: ${latitude}, Long: ${longitude}`,
      success: true,
    });
  } catch (error) {
    console.error("Failed to update location.", error);

    return Response.json({ error: "Error al actualizar la ubicacion." }, { status: 500 });
  }
}
