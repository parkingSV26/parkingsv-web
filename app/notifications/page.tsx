import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getNotificationsForUser } from "@/app/lib/notifications";
import NotificationsClient from "@/app/notifications/NotificationsClient";
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

  const initialNotifications = await getNotificationsForUser(sessionUser.id);

  return (
    <>
      <SiteHeader activePage="none" />

      <main>
        <NotificationsClient initialNotifications={initialNotifications} />
      </main>

      <SiteFooter />
    </>
  );
}
