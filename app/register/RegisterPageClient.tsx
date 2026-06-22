"use client";

import Image from "next/image";
import RegisterForm from "@/app/register/RegisterForm";
import { SiteAdSlot } from "@/components/SiteAdSlot";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { useSitePreferences } from "@/components/useSitePreferences";

export default function RegisterPageClient() {
  const preferences = useSitePreferences();
  const copy =
    preferences.language === "en"
      ? {
          description: "Join Parking SV and start managing your parking spaces.",
          title: "Create account",
        }
      : {
          description: "Unete a Parking SV y comienza a gestionar tus estacionamientos",
          title: "Crear cuenta",
        };

  return (
    <>
      <SiteHeader activePage="none" />

      <main className="register-page">
        <div className="register-container">
          <div className="register-card">
            <div className="register-header">
              <Image
                src="/parkingsv/logo-parking-sv.png"
                alt="Parking SV"
                className="register-logo"
                width={80}
                height={80}
                priority
              />
              <h1 className="register-title">{copy.title}</h1>
              <p className="register-subtitle">{copy.description}</p>
            </div>

            <RegisterForm />
          </div>
        </div>
      </main>

      <SiteAdSlot />
      <SiteFooter />
    </>
  );
}
