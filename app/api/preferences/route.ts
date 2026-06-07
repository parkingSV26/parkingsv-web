import { getSessionUser } from "@/app/lib/auth/session";
import { saveUserPreferences } from "@/app/lib/preferences";
import {
  normalizePreferences,
  type ParkingPreferences,
} from "@/app/settings/_lib/preferences";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as Partial<ParkingPreferences>;
    const preferences = normalizePreferences(payload);
    await saveUserPreferences(user.authUserId, preferences);

    return Response.json({
      preferences,
      success: true,
    });
  } catch (error) {
    console.error("Failed to update preferences.", error);
    return Response.json({ error: "No se pudieron guardar las preferencias." }, { status: 500 });
  }
}
