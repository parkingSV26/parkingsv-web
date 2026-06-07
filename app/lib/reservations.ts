import "server-only";

import type { Parking } from "@/app/parkings/parking-data";
import { getOwnedParkingsForUser, getPublishedParkings } from "@/app/lib/parkings";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { formatSupabaseErrorForLog } from "@/src/lib/supabase/errors";

export type ReservationStatus = "Cancelado" | "Reservado" | "Sancionado" | "Usado";

export type CustomerReservation = {
  endAt: string;
  id: string;
  parking: Parking;
  qrCode: string;
  startAt: string;
  status: ReservationStatus;
  vehicleCategory: string;
};

export type OwnerReservation = {
  createdAt: string;
  customer: {
    email: string;
    name: string;
    phone: string | null;
  };
  endAt: string;
  id: string;
  parking: Parking;
  qrCode: string;
  startAt: string;
  status: ReservationStatus;
  vehicleCategory: string;
};

type VehicleTypeRow = {
  category_name: string;
};

type ReservationRow = {
  codigo_qr: string;
  created_at: string;
  fechahorafin: string;
  fechahorainicio: string;
  id: number;
  parking_id: number;
  status: string | null;
  users?: {
    email: string;
    full_name: string;
    phone_number: string | null;
  } | Array<{
    email: string;
    full_name: string;
    phone_number: string | null;
  }> | null;
  vehicle_types?: VehicleTypeRow | VehicleTypeRow[] | null;
};

type CreateReservationInput = {
  endAt: string;
  parkingId: number;
  qrCode: string;
  startAt: string;
  userId: number;
  vehicleTypeId: number;
};

function asSingle<T>(value: T | T[] | null | undefined) {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function normalizeReservationStatus(status: string | null | undefined): ReservationStatus {
  switch (status) {
    case "cancelado":
      return "Cancelado";
    case "usado":
      return "Usado";
    case "sancionado":
      return "Sancionado";
    default:
      return "Reservado";
  }
}

export async function getCustomerReservationsForUser(userId: number) {
  try {
    const admin = createSupabaseAdminClient();
    const parkings = await getPublishedParkings();
    const parkingMap = new Map(parkings.map((parking) => [parking.dbId, parking]));
    const { data, error } = await admin
      .from("reservations")
      .select(
        "id, parking_id, fechahorainicio, fechahorafin, codigo_qr, status, created_at, vehicle_types(category_name)",
      )
      .eq("user_id", userId)
      .order("fechahorainicio", { ascending: false });

    if (error) {
      throw error;
    }

    return ((data ?? []) as ReservationRow[])
      .map((reservation) => {
        const parking = parkingMap.get(reservation.parking_id);

        if (!parking) {
          return null;
        }

        return {
          endAt: reservation.fechahorafin,
          id: String(reservation.id),
          parking,
          qrCode: reservation.codigo_qr,
          startAt: reservation.fechahorainicio,
          status: normalizeReservationStatus(reservation.status),
          vehicleCategory: asSingle(reservation.vehicle_types)?.category_name ?? "Vehiculo",
        } satisfies CustomerReservation;
      })
      .filter((reservation): reservation is CustomerReservation => reservation !== null);
  } catch (error) {
    console.warn("Failed to load customer reservations.", formatSupabaseErrorForLog(error));
    return [];
  }
}

export async function getOwnerReservationsForParking(ownerId: number, parkingSlug: string) {
  try {
    const ownedParkings = await getOwnedParkingsForUser(ownerId);
    const parking = ownedParkings.find((item) => item.id === parkingSlug) ?? null;

    if (!parking) {
      return {
        parking: null,
        reservations: [] as OwnerReservation[],
      };
    }

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("reservations")
      .select(
        "id, parking_id, fechahorainicio, fechahorafin, codigo_qr, status, created_at, vehicle_types(category_name), users(full_name, email, phone_number)",
      )
      .eq("parking_id", parking.dbId)
      .order("fechahorainicio", { ascending: false });

    if (error) {
      throw error;
    }

    return {
      parking,
      reservations: ((data ?? []) as ReservationRow[]).map((reservation) => {
        const user = asSingle(reservation.users);
        const vehicleType = asSingle(reservation.vehicle_types);

        return {
          createdAt: reservation.created_at,
          customer: {
            email: user?.email ?? "",
            name: user?.full_name ?? "Usuario Parking SV",
            phone: user?.phone_number ?? null,
          },
          endAt: reservation.fechahorafin,
          id: String(reservation.id),
          parking,
          qrCode: reservation.codigo_qr,
          startAt: reservation.fechahorainicio,
          status: normalizeReservationStatus(reservation.status),
          vehicleCategory: vehicleType?.category_name ?? "Vehiculo",
        };
      }),
    };
  } catch (error) {
    console.warn("Failed to load owner reservations.", formatSupabaseErrorForLog(error));
    return {
      parking: null,
      reservations: [] as OwnerReservation[],
    };
  }
}

export async function createReservationForUser(input: CreateReservationInput) {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("reservations")
      .insert({
        codigo_qr: input.qrCode,
        fechahorafin: input.endAt,
        fechahorainicio: input.startAt,
        parking_id: input.parkingId,
        status: "reservado",
        user_id: input.userId,
        vehicle_type_id: input.vehicleTypeId,
      })
      .select("id, codigo_qr, fechahorafin, fechahorainicio, parking_id, status, vehicle_type_id")
      .single();

    if (error) {
      throw error;
    }

    return data as
      | {
          codigo_qr: string;
          fechahorafin: string;
          fechahorainicio: string;
          id: number;
          parking_id: number;
          status: string | null;
          vehicle_type_id: number;
        }
      | null;
  } catch (error) {
    console.warn("Failed to create reservation.", formatSupabaseErrorForLog(error));
    return null;
  }
}
