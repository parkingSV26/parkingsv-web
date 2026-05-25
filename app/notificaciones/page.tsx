import type { Metadata } from "next";
import { redirect } from "next/navigation";
import NotificationsClient from "@/app/notificaciones/NotificationsClient";
import { createMockNotifications } from "@/app/notificaciones/_lib/mock-notifications";
import { getSessionUser } from "@/app/lib/auth/session";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Parking SV - Notificaciones",
  description: "ééplica en Next.js de la página de notificaciones de Parking SV.",
};

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login?redirect=/notificaciones");
  }

  // Sembramos notificaciones iniciales en servidor y luego el cliente las sincroniza en localStorage.
  const initialNotifications = createMockNotifications(sessionUser);

  return (
    <>
      <SiteHeader activePage="none" />

      <main>
        <NotificationsClient
          initialNotifications={initialNotifications}
          userId={sessionUser.id}
        />
      </main>

      <SiteFooter />
    </>
  );
}
