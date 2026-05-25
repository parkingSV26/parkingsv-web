import type { Metadata } from "next";
import { redirect } from "next/navigation";
import VerifyEmailForm from "@/app/verify-email/VerifyEmailForm";
import {
  getVerificationStatus,
  readPendingVerificationSession,
} from "@/app/lib/auth/verification";
import { SiteAdSlot } from "@/components/SiteAdSlot";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Parking SV - Verificar correo",
  description: "Verifica tu cuenta con el código enviado a tu correo.",
};

export default async function VerifyEmailPage() {
  // Solo se puede abrir esta vista si existe una verificación pendiente firmada en cookie.
  const pendingVerification = await readPendingVerificationSession();

  if (!pendingVerification) {
    redirect("/");
  }

  // El estado del código se recalcula en servidor para no depender de relojes del navegador.
  const status = await getVerificationStatus(pendingVerification.email);

  return (
    <>
      <SiteHeader activePage="none" />

      <main className="verify-page">
        <div className="verify-container">
          <div className="verify-card">
            <VerifyEmailForm
              email={pendingVerification.email}
              initialIsExpired={status.isExpired}
              initialRemainingAttempts={status.remainingAttempts}
            />
          </div>
        </div>
      </main>

      <SiteAdSlot />
      <SiteFooter />
    </>
  );
}
