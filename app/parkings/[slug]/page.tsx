import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedParkingBySlug } from "@/app/lib/parkings";
import { getSessionUser } from "@/app/lib/auth/session";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import ParkingDetailClient from "./ParkingDetailClient";

type ParkingDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: ParkingDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const parking = await getPublishedParkingBySlug(slug);

  if (!parking) {
    return {
      title: "Parking SV - Parqueo no encontrado",
    };
  }

  return {
    title: `Parking SV - ${parking.name}`,
    description: parking.description,
  };
}

export default async function ParkingDetailPage({ params }: ParkingDetailPageProps) {
  const { slug } = await params;
  const parking = await getPublishedParkingBySlug(slug);

  if (!parking) {
    notFound();
  }

  const sessionUser = await getSessionUser();

  return (
    <>
      <SiteHeader activePage="parkings" />
      <main>
        <ParkingDetailClient parking={parking} sessionUser={sessionUser} />
      </main>
      <SiteFooter />
    </>
  );
}
