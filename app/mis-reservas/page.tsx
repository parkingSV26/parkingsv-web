import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/app/lib/auth/session";
import { getDemoReservationsForUser } from "@/app/lib/demo-user-content";
import ReservationsClient from "@/app/mis-reservas/ReservationsClient";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Parking SV - Mis reservas",
  description: "Consulta tus reservas activas, su estado y el acceso QR asociado.",
};

export const dynamic = "force-dynamic";

export default async function MisReservasPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login?redirect=/mis-reservas");
  }

  if (sessionUser.userType !== "customer") {
    redirect("/mis-parqueos");
  }

  // Las reservas salen de datos demo ligados al usuario para mantener el recorrido de punta a punta.
  const reservations = getDemoReservationsForUser(sessionUser);

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
