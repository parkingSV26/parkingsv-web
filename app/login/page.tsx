import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import LoginForm from "@/app/login/LoginForm";
import { sanitizeAppRedirect } from "@/app/lib/auth/redirect";
import { SiteAdSlot } from "@/components/SiteAdSlot";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Parking SV - Iniciar sesion",
  description: "Accede a tus reservas, favoritos y parqueos publicados desde una pagina dedicada.",
};

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectTarget = sanitizeAppRedirect(readFirst(params.redirect));

  return (
    <>
      <SiteHeader activePage="none" />

      <main className="login-page">
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <Image
                src="/parkingsv/logo-parking-sv.png"
                alt="Parking SV"
                className="login-logo"
                width={82}
                height={82}
                priority
              />
              <h1>Iniciar sesion</h1>
              <p>
                Accede a tus reservas, favoritos y parqueos publicados desde una pagina dedicada.
              </p>
            </div>

            <LoginForm redirectTarget={redirectTarget} />

            <section className="inline-ad-slot login-ad-slot">
              <div className="inline-ad-slot__content">
                <span className="inline-ad-slot__eyebrow">Escalabilidad comercial</span>
                <h3>Anunciate aqui</h3>
                <p>
                  Parking SV puede monetizar esta pantalla con aliados locales y promociones
                  geolocalizadas.
                </p>
              </div>
              <Link href="/planes" className="inline-ad-slot__cta">
                Conocer planes
              </Link>
            </section>

            <div className="login-footer">
              <p>
                No tienes cuenta? <Link href="/register">Crear cuenta</Link>
              </p>
              <p>
                <Link href="/">Volver al inicio</Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <SiteAdSlot />
      <SiteFooter />
    </>
  );
}

function readFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}
