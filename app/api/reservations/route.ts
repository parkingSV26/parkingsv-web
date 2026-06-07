import { randomUUID } from "node:crypto";
import { getSessionUser } from "@/app/lib/auth/session";
import { createReservationForUser } from "@/app/lib/reservations";
import { getPublishedParkingBySlug } from "@/app/lib/parkings";
import { formatSupabaseErrorForLog, getSupabaseFriendlyErrorMessage } from "@/src/lib/supabase/errors";

export const dynamic = "force-dynamic";

const vehicleTypeIdPattern = /^\d+$/;

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  if (user.userType !== "customer") {
    return Response.json({ error: "Solo los clientes pueden reservar espacios." }, { status: 403 });
  }

  try {
    const payload = (await request.json()) as {
      endAt?: unknown;
      parkingId?: unknown;
      startAt?: unknown;
      vehicleTypeId?: unknown;
    };

    const parkingId = Number(payload.parkingId);
    const vehicleTypeId = Number(payload.vehicleTypeId);
    const startAt = String(payload.startAt ?? "").trim();
    const endAt = String(payload.endAt ?? "").trim();

    if (!Number.isInteger(parkingId) || parkingId <= 0) {
      return Response.json({ error: "Parqueo inválido." }, { status: 400 });
    }

    if (!vehicleTypeIdPattern.test(String(payload.vehicleTypeId ?? ""))) {
      return Response.json({ error: "Selecciona el tipo de vehículo." }, { status: 400 });
    }

    if (!startAt || !endAt) {
      return Response.json({ error: "Ingresa la fecha y hora de la reserva." }, { status: 400 });
    }

    const startDate = new Date(startAt);
    const endDate = new Date(endAt);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return Response.json({ error: "Las fechas de la reserva no son válidas." }, { status: 400 });
    }

    if (endDate <= startDate) {
      return Response.json({ error: "La hora de fin debe ser posterior a la de inicio." }, { status: 400 });
    }

    const parking = await getPublishedParkingBySlug(String(parkingId));

    if (!parking) {
      return Response.json({ error: "El parqueo no está disponible." }, { status: 404 });
    }

    if (!parking.vehicleCapacities.some((capacity) => capacity.id === vehicleTypeId)) {
      return Response.json({ error: "El tipo de vehículo seleccionado no está disponible." }, { status: 400 });
    }

    if (parking.reservableSpaces <= 0) {
      return Response.json({ error: "Este parqueo no tiene espacios reservables." }, { status: 400 });
    }

    const qrCode = `QR-${parking.dbId}-${user.id}-${Date.now()}-${randomUUID().slice(0, 8)}`.toUpperCase();
    const reservation = await createReservationForUser({
      endAt: endDate.toISOString(),
      parkingId: parking.dbId,
      qrCode,
      startAt: startDate.toISOString(),
      userId: user.id,
      vehicleTypeId,
    });

    if (!reservation) {
      return Response.json(
        { error: "No se pudo guardar la reserva. Intenta nuevamente." },
        { status: 500 },
      );
    }

    return Response.json({
      reservation: {
        code: reservation.codigo_qr,
        endAt: reservation.fechahorafin,
        id: reservation.id,
        parkingId: reservation.parking_id,
        startAt: reservation.fechahorainicio,
        status: reservation.status ?? "reservado",
        vehicleTypeId: reservation.vehicle_type_id,
      },
      success: true,
    });
  } catch (error) {
    console.error("Failed to create reservation.", formatSupabaseErrorForLog(error));

    return Response.json(
      {
        error: getSupabaseFriendlyErrorMessage(
          error,
          "No se pudo crear la reserva. Intenta nuevamente.",
        ),
      },
      { status: 500 },
    );
  }
}
