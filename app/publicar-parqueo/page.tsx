import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/app/lib/auth/session";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import PublishParkingClient from "./PublishParkingClient";

export const metadata: Metadata = {
  title: "Parking SV - Publicar parqueo",
  description: "Formulario para propietarios que desean publicar un nuevo parqueo.",
};

export const dynamic = "force-dynamic";

export default async function PublicarParqueoPage() {
  const sessionUser = await getSessionUser();

  // Esta pantalla está reservada para propietarios incluso en el flujo demo.
  if (!sessionUser) {
    redirect("/login?redirect=/publicar-parqueo");
  }

  if (sessionUser.userType !== "owner") {
    redirect("/mis-reservas");
  }

  return (
    <>
      <SiteHeader activePage="none" />
      <main>
        <PublishParkingClient ownerName={sessionUser.fullName} />
      </main>
      <SiteFooter />
    </>
  );
}
