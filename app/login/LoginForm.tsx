"use client";

import { useActionState, useState } from "react";
import { loginAction } from "@/app/login/actions";
import type { LoginFormState } from "@/app/login/login-form-state";
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
  redirectTarget: string;
};

export default function LoginForm({ redirectTarget }: LoginFormProps) {
  // useActionState nos deja conservar el último intento y mostrar errores sin otra capa de estado manual.
  const [state, formAction, pending] = useActionState(loginAction, {
    ...initialState,
    redirectTarget,
  });
  const [email, setEmail] = useState(state.values.email);
  const [password, setPassword] = useState(state.values.password);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="login-form">
      <input type="hidden" name="redirect" value={redirectTarget} />

      {/* El alert general aparece cuando las credenciales fallan o la action devuelve un error global. */}
      {state.errorMessage ? (
        <div className="login-alert">
          <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
          {state.errorMessage}
        </div>
      ) : null}

      <label className="login-label" htmlFor="login-email">
        Correo electronico
      </label>
      <div
        className={`${styles.inputShell} ${state.fieldErrors.email ? styles.inputShellError : ""}`}
      >
        <div className="login-input">
          <i className="fa-solid fa-envelope" aria-hidden="true" />
          <input
            id="login-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
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
        Contrasena
      </label>
      <div
        className={`${styles.inputShell} ${state.fieldErrors.password ? styles.inputShellError : ""}`}
      >
        <div className="login-input">
          <i className="fa-solid fa-lock" aria-hidden="true" />
          <input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Ingresa tu contrasena"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={state.fieldErrors.password ? "true" : "false"}
            aria-describedby={state.fieldErrors.password ? "login-password-error" : undefined}
          />
          <button
            type="button"
            className={styles.visibilityButton}
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
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
        <span>{pending ? "Entrando..." : "Entrar"}</span>
      </button>
    </form>
  );
}
