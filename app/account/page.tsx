import type { Metadata } from "next";
import Link from "next/link";
import AccountPageClient from "@/app/account/AccountPageClient";
import { getAccountPageData } from "@/app/lib/account";
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
    return (
      <>
        <SiteHeader activePage="none" />

        <main className="account-page">
          <section
            style={{
              background: "#fff",
              borderRadius: "16px",
              boxShadow: "0 12px 30px rgba(0, 0, 0, 0.08)",
              margin: "2rem auto",
              maxWidth: "760px",
              padding: "2rem",
              width: "calc(100% - 2rem)",
            }}
          >
            <h1 style={{ marginTop: 0 }}>No pudimos cargar tu cuenta</h1>
            <p style={{ lineHeight: 1.6 }}>
              La sesión quedó en un estado incompleto. Vuelve a iniciar sesión o, si acabas de
              confirmar tu correo, espera unos segundos y vuelve a intentar.
            </p>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <Link
                href="/login?redirect=/mi-cuenta"
                style={{
                  background: "#f1c40f",
                  borderRadius: "10px",
                  color: "#1f2937",
                  fontWeight: 700,
                  padding: "0.9rem 1.2rem",
                  textDecoration: "none",
                }}
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                  color: "#1f2937",
                  fontWeight: 700,
                  padding: "0.9rem 1.2rem",
                  textDecoration: "none",
                }}
              >
                Crear cuenta
              </Link>
            </div>
          </section>
        </main>

        <SiteAdSlot />
        <SiteFooter />
      </>
    );
  }

  const accountData = await getAccountPageData(sessionUser);

  if (!accountData) {
    return (
      <>
        <SiteHeader activePage="none" />

        <main className="account-page">
          <section
            style={{
              background: "#fff",
              borderRadius: "16px",
              boxShadow: "0 12px 30px rgba(0, 0, 0, 0.08)",
              margin: "2rem auto",
              maxWidth: "760px",
              padding: "2rem",
              width: "calc(100% - 2rem)",
            }}
          >
            <h1 style={{ marginTop: 0 }}>Tu perfil todavía se está preparando</h1>
            <p style={{ lineHeight: 1.6 }}>
              Ya detectamos tu sesión, pero todavía no pudimos cargar los datos del perfil.
              Reintenta en unos segundos. Si el problema sigue, vuelve a iniciar sesión.
            </p>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <Link
                href="/mi-cuenta"
                style={{
                  background: "#f1c40f",
                  borderRadius: "10px",
                  color: "#1f2937",
                  fontWeight: 700,
                  padding: "0.9rem 1.2rem",
                  textDecoration: "none",
                }}
              >
                Reintentar
              </Link>
              <Link
                href="/login?redirect=/mi-cuenta"
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                  color: "#1f2937",
                  fontWeight: 700,
                  padding: "0.9rem 1.2rem",
                  textDecoration: "none",
                }}
              >
                Iniciar sesión otra vez
              </Link>
            </div>
          </section>
        </main>

        <SiteAdSlot />
        <SiteFooter />
      </>
    );
  }

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
