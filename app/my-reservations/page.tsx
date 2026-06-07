import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCustomerReservationsForUser } from "@/app/lib/reservations";
import { getSessionUser } from "@/app/lib/auth/session";
import ReservationsClient from "@/app/my-reservations/ReservationsClient";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Parking SV - Mis reservas",
  description: "Consulta tus reservas activas, su estado y el acceso QR asociado.",
};

export const dynamic = "force-dynamic";

export default async function MyReservationsPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login?redirect=/mis-reservas");
  }

  if (sessionUser.userType !== "customer") {
    redirect("/mis-parqueos");
  }

  const reservations = await getCustomerReservationsForUser(sessionUser.id);

  return (
    <>
      <SiteHeader activePage="none" />
      <main>
        <ReservationsClient reservations={reservations} />
      </main>
      <SiteFooter />
    </>
  );
}
