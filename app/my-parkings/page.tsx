import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getOwnedParkingsForUser } from "@/app/lib/parkings";
import { getSessionUser } from "@/app/lib/auth/session";
import OwnerParkingsClient from "@/app/my-parkings/OwnerParkingsClient";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Parking SV - Mis parqueos",
  description: "Panel de propietario para revisar, editar y administrar publicaciones activas.",
};

export const dynamic = "force-dynamic";

export default async function MyParkingsPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login?redirect=/mis-parqueos");
  }

  if (sessionUser.userType !== "owner") {
    redirect("/mis-reservas");
  }

  const parkings = await getOwnedParkingsForUser(sessionUser.id);

  return (
    <>
      <SiteHeader activePage="none" />
      <main>
        <OwnerParkingsClient parkings={parkings} />
      </main>
      <SiteFooter />
    </>
  );
}
