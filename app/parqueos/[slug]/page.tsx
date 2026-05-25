import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/app/lib/auth/session";
import { getParkingBySlug, parkingData } from "@/app/parqueos/parking-data";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import ParkingDetailClient from "./ParkingDetailClient";

type ParkingDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export async function generateStaticParams() {
  // Los detalles demo se preconstruyen desde el catálogo local de parqueos.
  return parkingData.map((parking) => ({
    slug: parking.id,
  }));
}

export async function generateMetadata({
  params,
}: ParkingDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const parking = getParkingBySlug(slug);

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
  const parking = getParkingBySlug(slug);

  // Si el slug no existe en el catálogo estático, dejamos que Next resuelva el 404.
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
