import { db } from "@/app/lib/db";
import { getSessionUser } from "@/app/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    // El payload llega desde cliente, así que lo normalizamos antes de tocar la base.
    const payload = (await request.json()) as {
      latitude?: unknown;
      longitude?: unknown;
    };

    const latitude = Number(payload.latitude);
    const longitude = Number(payload.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return Response.json({ error: "Datos de ubicación invalidos." }, { status: 400 });
    }

    await db.execute("UPDATE users SET latitude = ?, longitude = ? WHERE id = ?", [
      latitude,
      longitude,
      user.id,
    ]);

    return Response.json({
      locationText: `Lat: ${latitude}, Long: ${longitude}`,
      success: true,
    });
  } catch (error) {
    console.error("Failed to update location.", error);

    return Response.json({ error: "Error al actualizar la ubicación." }, { status: 500 });
  }
}
