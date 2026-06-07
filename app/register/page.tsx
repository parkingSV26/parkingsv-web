import type { Metadata } from "next";
import Image from "next/image";
import RegisterForm from "@/app/register/RegisterForm";
import { SiteAdSlot } from "@/components/SiteAdSlot";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Parking SV - Crear cuenta",
  description: "Crea tu cuenta de Parking SV desde la versión en Next.js.",
};

export default async function RegisterPage() {
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
              <h1 className="register-title">Crear cuenta</h1>
              <p className="register-subtitle">
                Unete a Parking SV y comienza a gestionar tus estacionamientos
              </p>
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
