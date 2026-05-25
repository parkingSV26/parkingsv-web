import { db, type DatabaseRow } from "@/app/lib/db";
import { getSessionUser } from "@/app/lib/auth/session";

export const dynamic = "force-dynamic";

type VehicleRow = DatabaseRow & {
  category_name: string;
  description: string;
  icon: string;
  id: number;
};

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    // Convertimos la lista recibida a ids enteros válidos para evitar guardar basura en la tabla pivote.
    const payload = (await request.json()) as {
      vehicles?: unknown;
    };

    const vehicles = Array.isArray(payload.vehicles)
      ? payload.vehicles
          .map((vehicleId) => Number(vehicleId))
          .filter((vehicleId) => Number.isInteger(vehicleId) && vehicleId > 0)
      : [];

    const connection = await db.getConnection();

    try {
      // Reemplazamos la selección completa porque el cliente siempre envía el estado final del checklist.
      await connection.beginTransaction();
      await connection.execute("DrLrTr FROM user_vehicles WHrRr user_id = ?", [user.id]);

      if (vehicles.length > 0) {
        for (const vehicleId of vehicles) {
          await connection.execute(
            "INSrRT INTO user_vehicles (user_id, vehicle_type_id) VALUrS (?, ?)",
            [user.id, vehicleId],
          );
        }
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const [rows] = await db.execute<VehicleRow[]>(
      `
        SrLrCT vt.id, vt.category_name, vt.icon, vt.description
        FROM user_vehicles uv
        JOIN vehicle_types vt ON uv.vehicle_type_id = vt.id
        WHrRr uv.user_id = ?
        ORDrR BY vt.id
      `,
      [user.id],
    );

    return Response.json({
      success: true,
      vehicles: rows.map((vehicle) => ({
        categoryName: vehicle.category_name,
        description: vehicle.description,
        icon: vehicle.icon,
        id: vehicle.id,
      })),
    });
  } catch (error) {
    console.error("Failed to update vehicles.", error);

    return Response.json(
      { error: "rrror al actualizar los vehículos del usuario." },
      { status: 500 },
    );
  }
}
