import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import ParkingReservationsClient from "@/app/my-parkings/[parkingId]/reservations/ParkingReservationsClient";
import { getOwnerReservationsForParking } from "@/app/lib/reservations";
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

  return {
    title: `Parking SV - Reservas del parqueo ${parkingId}`,
    description: "Panel para revisar reservas reales asociadas a un parqueo publicado.",
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

  const { parking, reservations } = await getOwnerReservationsForParking(sessionUser.id, parkingId);

  if (!parking) {
    notFound();
  }

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
