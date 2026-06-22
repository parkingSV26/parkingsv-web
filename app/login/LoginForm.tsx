"use client";

import { useActionState, useState } from "react";
import { loginAction } from "@/app/login/actions";
import type { LoginFormState } from "@/app/login/login-form-state";
import { useSitePreferences } from "@/components/useSitePreferences";
import styles from "./login-form.module.css";

const initialState: LoginFormState = {
  errorMessage: "",
  fieldErrors: {},
  redirectTarget: "/parqueos",
  values: {
    email: "",
    password: "",
  },
  userType: null,
};

type LoginFormProps = {
  initialEmail?: string;
  registrationSuccess?: string;
  redirectTarget: string;
};

export default function LoginForm({
  initialEmail = "",
  registrationSuccess = "",
  redirectTarget,
}: LoginFormProps) {
  const preferences = useSitePreferences();
  const copy =
    preferences.language === "en"
      ? {
          emailLabel: "Email address",
          emailPlaceholder: "you@email.com",
          login: "Sign in",
          loginPending: "Signing in...",
          passwordLabel: "Password",
          passwordPlaceholder: "Enter your password",
          showPassword: "Show password",
          hidePassword: "Hide password",
        }
      : {
          emailLabel: "Correo electrónico",
          emailPlaceholder: "tu@correo.com",
          login: "Iniciar sesión",
          loginPending: "Entrando...",
          passwordLabel: "Contraseña",
          passwordPlaceholder: "Ingresa tu contraseña",
          showPassword: "Mostrar contraseña",
          hidePassword: "Ocultar contraseña",
        };

  const [state, formAction, pending] = useActionState(loginAction, {
    ...initialState,
    redirectTarget,
  });
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="login-form">
      <input type="hidden" name="redirect" value={redirectTarget} />
      <input type="hidden" name="language" value={preferences.language} />

      {registrationSuccess ? (
        <div className="message success" role="status">
          {registrationSuccess}
        </div>
      ) : null}

      {state.errorMessage ? (
        <div className="login-alert">
          <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
          {state.errorMessage}
        </div>
      ) : null}

      <label className="login-label" htmlFor="login-email">
        {copy.emailLabel}
      </label>
      <div className={`${styles.inputShell} ${state.fieldErrors.email ? styles.inputShellError : ""}`}>
        <div className="login-input">
          <i className="fa-solid fa-envelope" aria-hidden="true" />
          <input
            id="login-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={copy.emailPlaceholder}
            required
            defaultValue={initialEmail}
            aria-invalid={state.fieldErrors.email ? "true" : "false"}
            aria-describedby={state.fieldErrors.email ? "login-email-error" : undefined}
          />
        </div>
      </div>
      {state.fieldErrors.email ? (
        <p id="login-email-error" className={styles.fieldError}>
          {state.fieldErrors.email}
        </p>
      ) : null}

      <label className="login-label" htmlFor="login-password">
        {copy.passwordLabel}
      </label>
      <div className={`${styles.inputShell} ${state.fieldErrors.password ? styles.inputShellError : ""}`}>
        <div className="login-input">
          <i className="fa-solid fa-lock" aria-hidden="true" />
          <input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder={copy.passwordPlaceholder}
            required
            minLength={8}
            aria-invalid={state.fieldErrors.password ? "true" : "false"}
            aria-describedby={state.fieldErrors.password ? "login-password-error" : undefined}
          />
          <button
            type="button"
            className={styles.visibilityButton}
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? copy.hidePassword : copy.showPassword}
          >
            <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`} aria-hidden="true" />
          </button>
        </div>
      </div>
      {state.fieldErrors.password ? (
        <p id="login-password-error" className={styles.fieldError}>
          {state.fieldErrors.password}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="login-btn">
        <i className="fa-solid fa-right-to-bracket" aria-hidden="true" />{" "}
        <span>{pending ? copy.loginPending : copy.login}</span>
      </button>
    </form>
  );
}
