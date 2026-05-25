import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SettingsClient from "@/app/configuracion/SettingsClient";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getSessionUser } from "@/app/lib/auth/session";

export const metadata: Metadata = {
  title: "Parking SV - Configuración",
  description: "Réplica en Next.js de la página de configuración con vista previa inmediata.",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  // La configuración solo tiene sentido si conocemos al usuario que la está guardando.
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login?redirect=/configuracion");
  }

  return (
    <>
      <SiteHeader activePage="none" />
      <main>
        <SettingsClient userId={sessionUser.id} />
      </main>
      <SiteFooter />
    </>
  );
}
