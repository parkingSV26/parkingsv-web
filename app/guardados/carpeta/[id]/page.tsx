import type { Metadata } from "next";
import FolderDetailClient from "@/app/guardados/_components/FolderDetailClient";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Parking SV - Carpeta de guardados",
  description: "Vista detallada de una carpeta de guardados dentro de Parking SV.",
};

type FolderPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GuardadosFolderPage({ params }: FolderPageProps) {
  const { id } = await params;

  return (
    <>
      <SiteHeader activePage="none" />
      <main>
        {/* El detalle busca el folder en cliente porque la fuente actual también vive en localStorage. */}
        <FolderDetailClient folderId={id} />
      </main>
      <SiteFooter />
    </>
  );
}
