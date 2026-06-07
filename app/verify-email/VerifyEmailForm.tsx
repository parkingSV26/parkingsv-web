"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resendVerificationEmailAction } from "@/app/verify-email/actions";
import type { VerifyEmailState } from "@/app/verify-email/verify-email-state";

type VerifyEmailFormProps = {
  email: string;
};

export default function VerifyEmailForm({ email }: VerifyEmailFormProps) {
  const [state, formAction, pending] = useActionState(resendVerificationEmailAction, {
    email,
    errorMessage: "",
    revision: 0,
    successMessage: "",
  } satisfies VerifyEmailState);

  return (
    <>
      <div className="verify-header">
        <div className="icon-container">
          <i className="fas fa-envelope-open-text" aria-hidden="true" />
        </div>
        <h1 className="verify-title">Correo sin verificación</h1>
        <p className="verify-subtitle">
          Tu cuenta queda activa al registrarte. No necesitas confirmar correo por ahora.
          <br />
          <strong>{email}</strong>
        </p>
      </div>

      {state.errorMessage ? (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle" aria-hidden="true" />
          <span>{state.errorMessage}</span>
        </div>
      ) : null}

      {state.successMessage ? (
        <div className="alert alert-success">
          <i className="fas fa-check-circle" aria-hidden="true" />
          <span>{state.successMessage}</span>
        </div>
      ) : null}

      <div className="help-section">
        <p className="help-text">
          <i className="fas fa-circle-info" aria-hidden="true" />
          Si venías de un enlace antiguo, simplemente vuelve a iniciar sesión.
        </p>
      </div>

      <form action={formAction} className="verify-form">
        <input type="hidden" name="email" value={email} />
        <button type="submit" className="btn-resend" disabled={pending}>
          <i className={`fas ${pending ? "fa-spinner fa-spin" : "fa-paper-plane"}`} aria-hidden="true" />
          {pending ? " Reenviando..." : " Reenviar enlace"}
        </button>
      </form>

      <div className="verify-footer-actions">
        <Link href="/login">Volver a iniciar sesion</Link>
      </div>
    </>
  );
}
