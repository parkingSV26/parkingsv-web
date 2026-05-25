import { db, type DatabaseRow } from "@/app/lib/db";
import { getSessionUser } from "@/app/lib/auth/session";

export const dynamic = "force-dynamic";

type SpecificationRow = DatabaseRow & {
  description: string;
  has_value: number;
  icon: string;
  id: number;
  name: string;
  value: string | null;
  value_label: string | null;
};

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    // Cada especificación puede traer valor o solo estar activada, así que normalizamos ambos casos aquí.
    const payload = (await request.json()) as {
      specifications?: Array<{
        id?: unknown;
        value?: unknown;
      }>;
    };

    const specifications = Array.isArray(payload.specifications)
      ? payload.specifications
          .map((specification) => ({
            id: Number(specification.id),
            value:
              typeof specification.value === "string"
                ? specification.value.trim()
                : specification.value === null || specification.value === undefined
                  ? ""
                  : String(specification.value),
          }))
          .filter((specification) => Number.isInteger(specification.id) && specification.id > 0)
      : [];

    const connection = await db.getConnection();

    try {
      // Igual que en vehículos, reconstruimos el set actual para mantener simple la sincronización.
      await connection.beginTransaction();
      await connection.execute("DELETE FROM user_specifications WHERE user_id = ?", [user.id]);

      for (const specification of specifications) {
        await connection.execute(
          `
            INSERT INTO user_specifications (user_id, specification_type_id, value)
            VALUES (?, ?, ?)
          `,
          [user.id, specification.id, specification.value],
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const [rows] = await db.execute<SpecificationRow[]>(
      `
        SELECT ust.id, ust.name, ust.icon, ust.has_value, ust.value_label, ust.description, us.value
        FROM user_specification_types ust
        LEFT JOIN user_specifications us
          ON ust.id = us.specification_type_id
         AND us.user_id = ?
        ORDER BY ust.id
      `,
      [user.id],
    );

    return Response.json({
      specifications: rows.map((specification) => {
        const value = specification.value?.trim() ?? "";

        return {
          description: specification.description,
          hasValue: Boolean(specification.has_value),
          icon: specification.icon,
          id: specification.id,
          isActive: value.length > 0 || specification.value === "0",
          name: specification.name,
          value,
          valueLabel: specification.value_label,
        };
      }),
      success: true,
    });
  } catch (error) {
    console.error("Failed to update specifications.", error);

    return Response.json(
      { error: "Error al actualizar las especificaciones del usuario." },
      { status: 500 },
    );
  }
}
