import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserPreferences } from "@/app/lib/preferences";
import SettingsClient from "@/app/settings/SettingsClient";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getSessionUser } from "@/app/lib/auth/session";

export const metadata: Metadata = {
  title: "Parking SV - Configuración",
  description: "Réplica en Next.js de la página de configuración con vista previa inmediata.",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  // Settings only make sense if we know which user is saving them.
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login?redirect=/configuracion");
  }

  const initialPreferences = await getUserPreferences(sessionUser.authUserId);

  return (
    <>
      <SiteHeader activePage="none" />
      <main>
        <SettingsClient
          initialPreferences={initialPreferences}
          userId={sessionUser.id}
        />
      </main>
      <SiteFooter />
    </>
  );
}
