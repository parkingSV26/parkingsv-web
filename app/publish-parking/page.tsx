import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/app/lib/auth/session";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getPublishParkingCatalog } from "./_lib/publish-parking";
import PublishParkingClient from "./PublishParkingClient";

export const metadata: Metadata = {
  title: "Parking SV - Publicar parqueo",
  description: "Formulario para propietarios que desean publicar un nuevo parqueo.",
};

export const dynamic = "force-dynamic";

export default async function PublishParkingPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login?redirect=/publicar-parqueo");
  }

  if (sessionUser.userType !== "owner") {
    redirect("/mis-reservas");
  }

  const catalog = await getPublishParkingCatalog();

  return (
    <>
      <SiteHeader activePage="none" />
      <main>
        <PublishParkingClient
          catalog={catalog}
          ownerEmail={sessionUser.email}
          ownerName={sessionUser.fullName}
          ownerPhone={sessionUser.phoneNumber ?? ""}
        />
      </main>
      <SiteFooter />
    </>
  );
}
