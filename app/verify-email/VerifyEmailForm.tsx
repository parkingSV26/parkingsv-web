"use client";

import { useActionState, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { verifyEmailAction } from "@/app/verify-email/actions";
import type { VerifyEmailState } from "@/app/verify-email/verify-email-state";

type VerifyEmailFormProps = {
  email: string;
  initialIsExpired: boolean;
  initialRemainingAttempts: number;
};

function VerifySubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="btn-verify" id="verifyBtn" disabled={disabled || pending}>
      <span className="btn-text" style={{ display: pending ? "none" : "inline" }}>
        Verificar código
      </span>
      <span className="btn-loader" style={{ display: pending ? "inline-block" : "none" }}>
        <i className="fas fa-spinner fa-spin" aria-hidden="true" />
      </span>
    </button>
  );
}

function ResendCodeButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="btn-resend" id="resendBtn" disabled={pending}>
      <i className={`fas ${pending ? "fa-spinner fa-spin" : "fa-paper-plane"}`} aria-hidden="true" />
      {pending ? " Enviando..." : " Reenviar código"}
    </button>
  );
}

export default function VerifyEmailForm({
  email,
  initialIsExpired,
  initialRemainingAttempts,
}: VerifyEmailFormProps) {
  const router = useRouter();
  // El estado inicial viene del servidor para reflejar expiración e intentos disponibles desde el primer render.
  const initialState = useMemo(
    () => ({
      codeError: "",
      generalError: "",
      isExpired: initialIsExpired,
      remainingAttempts: initialRemainingAttempts,
      resendSuccess: "",
      revision: 0,
      success: false,
    }),
    [initialIsExpired, initialRemainingAttempts],
  );
  const [state, formAction] = useActionState<VerifyEmailState, FormData>(
    verifyEmailAction,
    initialState,
  );

  useEffect(() => {
    // Tras validar el código damos un respiro corto antes de mandar al usuario al inicio.
    if (!state.success) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      router.replace("/");
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [router, state.success]);

  return (
    <>
      <div className="verify-header">
        <div className="icon-container">
          {state.success ? (
            <i className="fas fa-check-circle success-icon" aria-hidden="true" />
          ) : (
            <i className="fas fa-envelope-open-text" aria-hidden="true" />
          )}
        </div>
        <h1 className="verify-title">{state.success ? "¡Cuenta verificada!" : "Verifica tu correo"}</h1>
        <p className="verify-subtitle">
          {state.success ? (
            "Tu cuenta ha sido activada exitosamente."
          ) : (
            <>
              Hemos enviado un código de 6 dígitos a:
              <br />
              <strong>{email}</strong>
            </>
          )}
        </p>
      </div>

      {state.success ? (
        <div className="success-message">
          <i className="fas fa-rocket" aria-hidden="true" />
          <p>Redirigiendo al inicio...</p>
        </div>
      ) : (
        <>
          {state.generalError ? (
            <div className="alert alert-error">
              <i className="fas fa-exclamation-circle" aria-hidden="true" />
              <span>{state.generalError}</span>
            </div>
          ) : null}

          {state.resendSuccess ? (
            <div className="alert alert-success">
              <i className="fas fa-check-circle" aria-hidden="true" />
              <span>{state.resendSuccess}</span>
            </div>
          ) : null}

          <VerificationFields
            key={state.revision}
            email={email}
            formAction={formAction}
            state={state}
          />
        </>
      )}
    </>
  );
}

function VerificationFields({
  email,
  formAction,
  state,
}: {
  email: string;
  formAction: (formData: FormData) => void;
  state: VerifyEmailState;
}) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));

  const codeValue = digits.join("");

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function updateDigit(index: number, rawValue: string) {
    const value = rawValue.replace(/[^0-9]/g, "").slice(-1);

    setDigits((current) => {
      const nextDigits = [...current];
      nextDigits[index] = value;
      return nextDigits;
    });

    if (value && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputRefs.current[index - 1]?.focus();
      return;
    }

    if (event.key === "ArrowRight" && index < inputRefs.current.length - 1) {
      event.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(clipboardText: string) {
    const numbers = clipboardText.replace(/[^0-9]/g, "").slice(0, 6).split("");

    if (numbers.length !== 6) {
      return;
    }

    setDigits(numbers);
    inputRefs.current[5]?.focus();
  }

  return (
    <>
      <form action={formAction} className="verify-form" id="verifyForm">
        <input type="hidden" name="intent" value="verify_code" />
        <input type="hidden" name="code" id="codeHidden" value={codeValue} />

        <div className={`form-group ${state.codeError ? "has-error" : ""}`}>
          <label htmlFor="code-digit-0" className="form-label">
            <i className="fas fa-key" aria-hidden="true" />
            Código de verificación
          </label>
          <div className="code-input-container" id="codeInputContainer">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                type="text"
                id={`code-digit-${index}`}
                maxLength={1}
                autoComplete="off"
                inputMode="numeric"
                className={`code-digit ${digit ? "filled" : ""} ${state.codeError ? "error" : ""}`}
                value={digit}
                onChange={(event) => updateDigit(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                onPaste={(event) => {
                  event.preventDefault();
                  handlePaste(event.clipboardData.getData("text"));
                }}
              />
            ))}
          </div>
          {state.codeError ? <span className="error-message">{state.codeError}</span> : null}
        </div>

        <div className="info-section">
          <div className="info-item">
            <i className="fas fa-clock" aria-hidden="true" />
            <span>El código expira en 10 minutos</span>
          </div>
          <div className="info-item">
            <i className="fas fa-shield-alt" aria-hidden="true" />
            <span>
              Intentos restantes: <strong>{state.remainingAttempts}/3</strong>
            </span>
          </div>
        </div>

        <VerifySubmitButton disabled={codeValue.length !== 6} />
      </form>

      <div className="resend-section">
        <p>¿No recibiste el código?</p>
        <form action={formAction} style={{ display: "inline" }}>
          <input type="hidden" name="intent" value="resend_code" />
          <ResendCodeButton />
        </form>
      </div>

      <div className="help-section">
        <p className="help-text">
          <i className="fas fa-info-circle" aria-hidden="true" />
          Revisa tu carpeta de spam si no encuentras el correo enviado a <strong>{email}</strong>.
        </p>
      </div>
    </>
  );
}
