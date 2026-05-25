import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import ParkingReservationsClient from "@/app/mis-parqueos/[parkingId]/reservas/ParkingReservationsClient";
import {
  getDemoOwnedParkingForUser,
  getDemoOwnerReservationsForParking,
} from "@/app/lib/demo-user-content";
import { getParkingBySlug } from "@/app/parqueos/parking-data";
import { getSessionUser } from "@/app/lib/auth/session";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

type ParkingReservationsPageProps = {
  params: Promise<{ parkingId: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: ParkingReservationsPageProps): Promise<Metadata> {
  const { parkingId } = await params;
  const parking = getParkingBySlug(parkingId);

  if (!parking) {
    return {
      title: "Parking SV - Reservas del parqueo",
    };
  }

  return {
    title: `Parking SV - Reservas de ${parking.name}`,
    description: `Panel para revisar reservas reportadas en ${parking.name}.`,
  };
}

export default async function ParkingReservationsPage({
  params,
}: ParkingReservationsPageProps) {
  const { parkingId } = await params;
  const sessionUser = await getSessionUser();

  // La ruta conserva el parking en la URL para poder volver directo al panel correcto.
  if (!sessionUser) {
    redirect(`/login?redirect=/mis-parqueos/${parkingId}/reservas`);
  }

  if (sessionUser.userType !== "owner") {
    redirect("/mis-reservas");
  }

  const parking = getDemoOwnedParkingForUser(sessionUser, parkingId);

  if (!parking) {
    notFound();
  }

  const reservations = getDemoOwnerReservationsForParking(sessionUser, parkingId);

  return (
    <>
      <SiteHeader activePage="none" />
      <main>
        <ParkingReservationsClient parking={parking} reservations={reservations} />
      </main>
      <SiteFooter />
    </>
  );
}
