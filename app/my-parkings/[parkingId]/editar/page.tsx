import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/app/lib/auth/session";
import { getOwnedParkingsForUser } from "@/app/lib/parkings";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getPublishParkingCatalog } from "@/app/publish-parking/_lib/publish-parking";
import PublishParkingClient from "@/app/publish-parking/PublishParkingClient";

type EditParkingPageProps = {
  params: Promise<{ parkingId: string }>;
};

export const metadata: Metadata = {
  title: "Parking SV - Editar parqueo",
  description: "Página completa para editar todos los campos de un parqueo publicado.",
};

export const dynamic = "force-dynamic";

export default async function EditParkingPage({ params }: EditParkingPageProps) {
  const sessionUser = await getSessionUser();
  const { parkingId } = await params;

  if (!sessionUser) {
    redirect(`/login?redirect=/mis-parqueos/${parkingId}/editar`);
  }

  if (sessionUser.userType !== "owner") {
    redirect("/mis-reservas");
  }

  const [parkings, catalog] = await Promise.all([
    getOwnedParkingsForUser(sessionUser.id),
    getPublishParkingCatalog(),
  ]);

  const parking = parkings.find((item) => item.id === parkingId);

  if (!parking) {
    redirect("/mis-parqueos");
  }

  return (
    <>
      <SiteHeader activePage="none" />
      <main>
        <PublishParkingClient
          catalog={catalog}
          initialParking={parking}
          mode="edit"
          ownerEmail={sessionUser.email}
          ownerName={sessionUser.fullName}
          ownerPhone={sessionUser.phoneNumber ?? ""}
        />
      </main>
      <SiteFooter />
    </>
  );
}
