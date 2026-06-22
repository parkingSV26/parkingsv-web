"use client";

import Image from "next/image";
import Link from "next/link";
import LoginForm from "@/app/login/LoginForm";
import { SiteAdSlot } from "@/components/SiteAdSlot";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { useSitePreferences } from "@/components/useSitePreferences";

type LoginPageClientProps = {
  initialEmail: string;
  redirectTarget: string;
  wasRegistered: boolean;
};

export default function LoginPageClient({
  initialEmail,
  redirectTarget,
  wasRegistered,
}: LoginPageClientProps) {
  const preferences = useSitePreferences();
  const copy =
    preferences.language === "en"
      ? {
          description: "Access your reservations, favorites, and published parking spaces from a dedicated page.",
          inlineAdEyebrow: "Commercial scalability",
          inlineAdTitle: "Advertise here",
          inlineAdDescription:
            "Parking SV can monetize this screen with local partners and geolocated promotions.",
          inlineAdCta: "View plans",
          loginTitle: "Sign in",
          noAccount: "Don't have an account?",
          register: "Create account",
          returnHome: "Back to home",
          success: "Your account was created successfully. You can sign in now.",
        }
      : {
          description: "Accede a tus reservas, favoritos y parqueos publicados desde una pagina dedicada.",
          inlineAdEyebrow: "Escalabilidad comercial",
          inlineAdTitle: "Anunciate aqui",
          inlineAdDescription:
            "Parking SV puede monetizar esta pantalla con aliados locales y promociones geolocalizadas.",
          inlineAdCta: "Conocer planes",
          loginTitle: "Iniciar sesion",
          noAccount: "No tienes cuenta?",
          register: "Crear cuenta",
          returnHome: "Volver al inicio",
          success: "Tu cuenta fue creada correctamente. Ahora puedes iniciar sesion.",
        };

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
              <h1>{copy.loginTitle}</h1>
              <p>{copy.description}</p>
            </div>

            <LoginForm
              initialEmail={initialEmail}
              registrationSuccess={wasRegistered ? copy.success : ""}
              redirectTarget={redirectTarget}
            />

            <section className="inline-ad-slot login-ad-slot">
              <div className="inline-ad-slot__content">
                <span className="inline-ad-slot__eyebrow">{copy.inlineAdEyebrow}</span>
                <h3>{copy.inlineAdTitle}</h3>
                <p>{copy.inlineAdDescription}</p>
              </div>
              <Link href="/planes" className="inline-ad-slot__cta">
                {copy.inlineAdCta}
              </Link>
            </section>

            <div className="login-footer">
              <p>
                {copy.noAccount} <Link href="/register">{copy.register}</Link>
              </p>
              <p>
                <Link href="/">{copy.returnHome}</Link>
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
