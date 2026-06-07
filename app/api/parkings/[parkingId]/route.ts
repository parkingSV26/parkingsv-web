import { getSessionUser } from "@/app/lib/auth/session";
import { getOwnedParkingsForUser } from "@/app/lib/parkings";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { formatSupabaseErrorForLog, getSupabaseFriendlyErrorMessage } from "@/src/lib/supabase/errors";

type ParkingRouteContext = {
  params: Promise<{ parkingId: string }>;
};

type ParkingOwnershipRow = {
  id: number;
  location_id: number | null;
  owner_id: number;
};

type UpdateParkingPayload = {
  address?: unknown;
  businessName?: unknown;
  department?: unknown;
  description?: unknown;
  is24_7?: unknown;
  mainPrice?: unknown;
  municipality?: unknown;
  name?: unknown;
  reference?: unknown;
  reservableSpaces?: unknown;
};

export const dynamic = "force-dynamic";

function parseParkingId(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function readText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readBoolean(value: unknown) {
  return value === true || value === "true" || value === "1" || value === "on";
}

function readNonNegativeInteger(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function toDatabaseFlag(value: boolean) {
  return value ? 1 : 0;
}

function parseMainPrice(value: string) {
  const normalized = value.trim().toLowerCase();
  const numericPart = normalized.replace(",", ".").match(/\d+(?:\.\d+)?/)?.[0] ?? "";
  const timeUnitMatch = normalized.match(/minuto|hora|dia|día|semana|mes|año|ano/);
  const rawTimeUnit = timeUnitMatch?.[0] ?? null;
  const normalizedTimeUnit =
    rawTimeUnit === "dia" ? "día" : rawTimeUnit === "ano" ? "año" : rawTimeUnit;

  return {
    price: numericPart,
    timeUnit: normalizedTimeUnit,
  };
}

async function loadOwnedParking(parkingId: number, ownerId: number) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("parkings")
    .select("id, owner_id, location_id")
    .eq("id", parkingId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const parking = data as ParkingOwnershipRow | null;

  if (!parking) {
    return {
      parking: null,
      status: 404,
    };
  }

  if (parking.owner_id !== ownerId) {
    return {
      parking: null,
      status: 403,
    };
  }

  return {
    parking,
    status: 200,
  };
}

export async function PATCH(request: Request, { params }: ParkingRouteContext) {
  const user = await getSessionUser();

  if (!user) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  if (user.userType !== "owner") {
    return Response.json({ error: "Solo propietarios pueden editar parqueos." }, { status: 403 });
  }

  const { parkingId } = await params;
  const parsedParkingId = parseParkingId(parkingId);

  if (!parsedParkingId) {
    return Response.json({ error: "Parqueo invalido." }, { status: 400 });
  }

  try {
    const ownership = await loadOwnedParking(parsedParkingId, user.id);

    if (!ownership.parking) {
      return Response.json(
        {
          error:
            ownership.status === 403
              ? "No puedes editar este parqueo."
              : "No se encontro el parqueo.",
        },
        { status: ownership.status },
      );
    }

    const payload = (await request.json()) as UpdateParkingPayload;
    const name = readText(payload.name);
    const businessName = readText(payload.businessName);
    const description = readText(payload.description);
    const department = readText(payload.department);
    const municipality = readText(payload.municipality);
    const address = readText(payload.address);
    const reference = readText(payload.reference);
    const reservableSpaces = readNonNegativeInteger(payload.reservableSpaces);
    const is24_7 = readBoolean(payload.is24_7);
    const mainPrice = readText(payload.mainPrice);

    if (!name || !businessName || !description || !department || !municipality || !address) {
      return Response.json({ error: "Completa la informacion principal del parqueo." }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();

    const { error: parkingError } = await admin
      .from("parkings")
      .update({
        contact_name: businessName,
        description,
        is_24_7: toDatabaseFlag(is24_7),
        name,
      })
      .eq("id", ownership.parking.id);

    if (parkingError) {
      throw parkingError;
    }

    const { error: userError } = await admin
      .from("users")
      .update({ business_name: businessName })
      .eq("id", user.id);

    if (userError) {
      throw userError;
    }

    if (ownership.parking.location_id) {
      const { error: locationError } = await admin
        .from("locations")
        .update({
          department,
          municipality,
          reference_address: reference || null,
          street_address: address,
        })
        .eq("id", ownership.parking.location_id);

      if (locationError) {
        throw locationError;
      }
    }

    const { error: capacityError } = await admin
      .from("parking_capacities")
      .update({ reservable_capacity: reservableSpaces })
      .eq("parking_id", ownership.parking.id);

    if (capacityError) {
      throw capacityError;
    }

    const parsedMainPrice = parseMainPrice(mainPrice);

    if (parsedMainPrice.price) {
      const { data: feeRow, error: feeLoadError } = await admin
        .from("parking_fees")
        .select("id")
        .eq("parking_id", ownership.parking.id)
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (feeLoadError) {
        throw feeLoadError;
      }

      if (feeRow?.id) {
        const { error: feeError } = await admin
          .from("parking_fees")
          .update({
            price: parsedMainPrice.price,
            ...(parsedMainPrice.timeUnit ? { time_unit: parsedMainPrice.timeUnit } : {}),
          })
          .eq("id", feeRow.id);

        if (feeError) {
          throw feeError;
        }
      }
    }

    const updatedParking = (await getOwnedParkingsForUser(user.id)).find(
      (parking) => parking.dbId === ownership.parking?.id,
    );

    return Response.json({
      parking: updatedParking ?? null,
      success: true,
    });
  } catch (error) {
    console.error("Failed to update parking.", formatSupabaseErrorForLog(error));

    return Response.json(
      {
        error: getSupabaseFriendlyErrorMessage(
          error,
          "No se pudo actualizar el parqueo.",
        ),
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: ParkingRouteContext) {
  const user = await getSessionUser();

  if (!user) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  if (user.userType !== "owner") {
    return Response.json({ error: "Solo propietarios pueden eliminar parqueos." }, { status: 403 });
  }

  const { parkingId } = await params;
  const parsedParkingId = parseParkingId(parkingId);

  if (!parsedParkingId) {
    return Response.json({ error: "Parqueo invalido." }, { status: 400 });
  }

  try {
    const ownership = await loadOwnedParking(parsedParkingId, user.id);

    if (!ownership.parking) {
      return Response.json(
        {
          error:
            ownership.status === 403
              ? "No puedes eliminar este parqueo."
              : "No se encontro el parqueo.",
        },
        { status: ownership.status },
      );
    }

    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from("parkings")
      .update({ status: "inactivo" })
      .eq("id", ownership.parking.id);

    if (error) {
      throw error;
    }

    return Response.json({
      deletedParkingId: ownership.parking.id,
      success: true,
    });
  } catch (error) {
    console.error("Failed to delete parking.", formatSupabaseErrorForLog(error));

    return Response.json(
      {
        error: getSupabaseFriendlyErrorMessage(
          error,
          "No se pudo eliminar el parqueo.",
        ),
      },
      { status: 500 },
    );
  }
}
