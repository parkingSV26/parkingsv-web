import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSavedParkingStateForUser } from "@/app/lib/favorites";
import { getPublishedParkings } from "@/app/lib/parkings";
import { getSessionUser } from "@/app/lib/auth/session";
import FolderDetailClient from "@/app/saved/_components/FolderDetailClient";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Parking SV - Carpeta de guardados",
  description: "Vista detallada de una carpeta de guardados dentro de Parking SV.",
};

type FolderPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SavedFolderPage({ params }: FolderPageProps) {
  const { id } = await params;
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect(`/login?redirect=/guardados/carpeta/${id}`);
  }

  const [savedState, parkings] = await Promise.all([
    getSavedParkingStateForUser(sessionUser.id),
    getPublishedParkings(),
  ]);

  return (
    <>
      <SiteHeader activePage="none" />
      <main>
        <FolderDetailClient folderId={id} initialState={savedState} parkings={parkings} />
      </main>
      <SiteFooter />
    </>
  );
}
