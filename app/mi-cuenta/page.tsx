import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AccountPageClient from "@/app/mi-cuenta/AccountPageClient";
import { createMockAccountPageData } from "@/app/lib/account";
import { getSessionUser } from "@/app/lib/auth/session";
import { SiteAdSlot } from "@/components/SiteAdSlot";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Parking SV - Mi Cuenta",
  description: "Administra tu perfil, vehículos, ubicación y especificaciones en Parking SV.",
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login?redirect=/mi-cuenta");
  }

  // Mientras se conecta backend real, la página consume una versión demo coherente con la sesión.
  const accountData = createMockAccountPageData(sessionUser);

  return (
    <>
      <SiteHeader activePage="none" />

      <main className="account-page">
        <AccountPageClient data={accountData} />
      </main>

      <SiteAdSlot />
      <SiteFooter />
    </>
  );
}
