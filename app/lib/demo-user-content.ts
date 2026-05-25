import { parkingData, type Parking } from "@/app/parqueos/parking-data";
import type { SessionUser } from "@/app/lib/auth/session";

export type ReservationStatus = "Cancelado" | "Reservado" | "Usado";

export type DemoReservation = {
  endAt: string;
  id: string;
  parking: Parking;
  qrCode: string;
  startAt: string;
  status: ReservationStatus;
  vehicleCategory: string;
};

export type DemoOwnerReservation = {
  amountPaid: number;
  createdAt: string;
  customer: {
    email: string;
    name: string;
    phone: string;
  };
  endAt: string;
  id: string;
  notes: string;
  parking: Parking;
  paymentMethod: "Efectivo" | "Tarjeta" | "Transferencia";
  qrCode: string;
  source: "App" | "Web";
  spacesReserved: number;
  startAt: string;
  status: ReservationStatus;
  vehicleCategory: string;
  vehiclePlate: string;
 };

export function getDemoReservationsForUser(user: SessionUser): DemoReservation[] {
  if (user.userType !== "customer") {
    return [];
  }

  const galerias = getParkingOrThrow("parqueo-galerias");
  const morazan = getParkingOrThrow("parqueo-morazan");
  const espana = getParkingOrThrow("parqueo-espana");

  return [
    {
      id: `reservation-${user.id}-01`,
      parking: galerias,
      vehicleCategory: "Sedan compacto",
      startAt: "2026-05-14T09:30:00",
      endAt: "2026-05-14T13:30:00",
      status: "Reservado",
      qrCode: "QR-GAL-4208",
    },
    {
      id: `reservation-${user.id}-02`,
      parking: morazan,
      vehicleCategory: "Pickup",
      startAt: "2026-05-10T18:00:00",
      endAt: "2026-05-10T21:00:00",
      status: "Usado",
      qrCode: "QR-MOR-1934",
    },
    {
      id: `reservation-${user.id}-03`,
      parking: espana,
      vehicleCategory: "Motocicleta",
      startAt: "2026-05-07T08:00:00",
      endAt: "2026-05-07T10:00:00",
      status: "Cancelado",
      qrCode: "QR-ESP-5511",
    },
  ];
}

export function getDemoOwnedParkingsForUser(user: SessionUser) {
  if (user.userType !== "owner") {
    return [];
  }

  return [getParkingOrThrow("parqueo-espana"), getParkingOrThrow("parqueo-galerias")];
}

export function getDemoOwnedParkingForUser(user: SessionUser, parkingId: string) {
  if (user.userType !== "owner") {
    return null;
  }

  return getDemoOwnedParkingsForUser(user).find((parking) => parking.id === parkingId) ?? null;
}

export function getDemoOwnerReservationsForParking(
  user: SessionUser,
  parkingId: string,
): DemoOwnerReservation[] {
  const parking = getDemoOwnedParkingForUser(user, parkingId);

  if (!parking) {
    return [];
  }

  const reservationsByParking: Record<string, DemoOwnerReservation[]> = {
    "parqueo-espana": [
      {
        id: `owner-res-${parking.id}-01`,
        parking,
        customer: {
          name: "Daniela Flores",
          email: "daniela.flores@gmail.com",
          phone: "7221-1134",
        },
        vehicleCategory: "Sedan compacto",
        vehiclePlate: "P 839-241",
        startAt: "2026-05-16T08:00:00",
        endAt: "2026-05-16T12:00:00",
        createdAt: "2026-05-15T19:10:00",
        status: "Reservado",
        amountPaid: 12,
        spacesReserved: 1,
        paymentMethod: "Tarjeta",
        source: "App",
        qrCode: "QR-ESP-8801",
        notes: "Pidio acceso rapido porque asistira a una reunion cerca del Centro Historico.",
      },
      {
        id: `owner-res-${parking.id}-02`,
        parking,
        customer: {
          name: "Ricardo Abarca",
          email: "ricardo.abarca@gmail.com",
          phone: "7610-5522",
        },
        vehicleCategory: "Motocicleta",
        vehiclePlate: "M 18-447",
        startAt: "2026-05-15T13:30:00",
        endAt: "2026-05-15T16:00:00",
        createdAt: "2026-05-15T09:05:00",
        status: "Usado",
        amountPaid: 4.5,
        spacesReserved: 1,
        paymentMethod: "Efectivo",
        source: "Web",
        qrCode: "QR-ESP-8802",
        notes: "Ingreso confirmado por vigilancia y salida registrada sin incidencias.",
      },
      {
        id: `owner-res-${parking.id}-03`,
        parking,
        customer: {
          name: "Marcela Orellana",
          email: "marcela.orellana@gmail.com",
          phone: "7899-0018",
        },
        vehicleCategory: "Pickup",
        vehiclePlate: "P 401-662",
        startAt: "2026-05-17T10:00:00",
        endAt: "2026-05-17T18:00:00",
        createdAt: "2026-05-15T22:48:00",
        status: "Reservado",
        amountPaid: 18,
        spacesReserved: 2,
        paymentMethod: "Transferencia",
        source: "App",
        qrCode: "QR-ESP-8803",
        notes: "Reservo dos espacios por visita familiar al Centro Historico durante el fin de semana.",
      },
      {
        id: `owner-res-${parking.id}-04`,
        parking,
        customer: {
          name: "Kevin Martinez",
          email: "kevin.martinez@gmail.com",
          phone: "7444-2901",
        },
        vehicleCategory: "Auto mediano",
        vehiclePlate: "P 214-905",
        startAt: "2026-05-14T07:30:00",
        endAt: "2026-05-14T09:30:00",
        createdAt: "2026-05-13T20:22:00",
        status: "Cancelado",
        amountPaid: 0,
        spacesReserved: 1,
        paymentMethod: "Tarjeta",
        source: "Web",
        qrCode: "QR-ESP-8804",
        notes: "El cliente cancelo antes de llegar por cambio de ruta hacia el centro.",
      },
    ],
    "parqueo-galerias": [
      {
        id: `owner-res-${parking.id}-01`,
        parking,
        customer: {
          name: "Sofia Cruz",
          email: "sofia.cruz@gmail.com",
          phone: "7300-1882",
        },
        vehicleCategory: "SUV",
        vehiclePlate: "P 510-732",
        startAt: "2026-05-16T18:00:00",
        endAt: "2026-05-16T22:30:00",
        createdAt: "2026-05-15T21:03:00",
        status: "Reservado",
        amountPaid: 15.75,
        spacesReserved: 1,
        paymentMethod: "Tarjeta",
        source: "App",
        qrCode: "QR-GAL-7711",
        notes: "Marcada como visita de compras en zona comercial con salida prevista al cierre de la tarde.",
      },
      {
        id: `owner-res-${parking.id}-02`,
        parking,
        customer: {
          name: "Jorge Hernandez",
          email: "jorge.h@gmail.com",
          phone: "7118-9035",
        },
        vehicleCategory: "Motocicleta",
        vehiclePlate: "M 07-552",
        startAt: "2026-05-15T11:00:00",
        endAt: "2026-05-15T13:00:00",
        createdAt: "2026-05-15T08:10:00",
        status: "Usado",
        amountPaid: 3.25,
        spacesReserved: 1,
        paymentMethod: "Efectivo",
        source: "Web",
        qrCode: "QR-GAL-7712",
        notes: "Acceso validado correctamente en la entrada principal del lote comercial.",
      },
      {
        id: `owner-res-${parking.id}-03`,
        parking,
        customer: {
          name: "Paola Guardado",
          email: "paola.guardado@gmail.com",
          phone: "7585-6021",
        },
        vehicleCategory: "Microbus",
        vehiclePlate: "MB 19-300",
        startAt: "2026-05-18T09:00:00",
        endAt: "2026-05-18T17:00:00",
        createdAt: "2026-05-15T18:55:00",
        status: "Reservado",
        amountPaid: 24,
        spacesReserved: 2,
        paymentMethod: "Transferencia",
        source: "App",
        qrCode: "QR-GAL-7713",
        notes: "Reservacion corporativa para una jornada de entregas y compras en la zona comercial.",
      },
    ],
  };

  return reservationsByParking[parkingId] ?? [];
}

function getParkingOrThrow(parkingId: string) {
  const parking = parkingData.find((item) => item.id === parkingId);

  if (!parking) {
    throw new Error(`No se encontro el parqueo "${parkingId}".`);
  }

  return parking;
}
