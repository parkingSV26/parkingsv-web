import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/app/lib/auth/session";
import { getDemoOwnedParkingsForUser } from "@/app/lib/demo-user-content";
import OwnerParkingsClient from "@/app/mis-parqueos/OwnerParkingsClient";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Parking SV - Mis parqueos",
  description: "Panel de propietario para revisar, editar y administrar publicaciones activas.",
};

export const dynamic = "force-dynamic";

export default async function MisParqueosPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login?redirect=/mis-parqueos");
  }

  if (sessionUser.userType !== "owner") {
    redirect("/mis-reservas");
  }

  // Este panel usa parqueos demo para que el dueño pueda probar edición y gestión sin base real.
  const parkings = getDemoOwnedParkingsForUser(sessionUser);

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
