import { getAccountPageData } from "@/app/lib/account";
import {
  readAuthMetadata,
  syncVehicleSelections,
  updateAuthMetadata,
} from "@/app/lib/account-mutations";
import { getSessionUser } from "@/app/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as {
      vehicles?: unknown;
    };

    const vehicles = Array.isArray(payload.vehicles)
      ? payload.vehicles
          .map((vehicleId) => Number(vehicleId))
          .filter((vehicleId) => Number.isInteger(vehicleId) && vehicleId > 0)
      : [];

    const metadata = await readAuthMetadata(user.authUserId);
    await updateAuthMetadata(user.authUserId, {
      ...metadata,
      vehicle_type_ids: vehicles,
    });
    await syncVehicleSelections(user.id, vehicles);

    const accountData = await getAccountPageData(user);

    return Response.json({
      success: true,
      vehicles: accountData?.userVehicles ?? [],
    });
  } catch (error) {
    console.error("Failed to update vehicles.", error);

    return Response.json(
      { error: "Error al actualizar los vehiculos del usuario." },
      { status: 500 },
    );
  }
}
