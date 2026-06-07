"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { registerAction } from "@/app/register/actions";
import type { RegisterFormState } from "@/app/register/register-form-state";

type RegisterValues = {
  confirm_password: string;
  date_of_birth: string;
  email: string;
  full_name: string;
  password: string;
  terms_accepted: boolean;
  user_type: "" | "customer" | "owner";
};

const initialState: RegisterFormState = {
  errors: {},
  values: {
    date_of_birth: "",
    email: "",
    full_name: "",
    terms_accepted: false,
    user_type: "",
  },
};

function getPasswordStrength(password: string) {
  let strength = 0;
  if (password.length >= 8) strength += 1;
  if (password.length >= 12) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
  if (password.length === 0) return "";
  if (strength <= 2) return "weak";
  if (strength <= 4) return "medium";
  return "strong";
}

function RegisterSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="btn-register" id="submitBtn" disabled={pending}>
      <span className="btn-text" style={{ display: pending ? "none" : "inline" }}>
        Crear cuenta
      </span>
      <span className="btn-loader" style={{ display: pending ? "flex" : "none" }}>
        <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
      </span>
    </button>
  );
}

export default function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialState);
  const formKey = `${state.values.full_name}|${state.values.date_of_birth}|${state.values.email}|${state.values.user_type}|${state.values.terms_accepted}`;

  return <RegisterFormFields key={formKey} state={state} formAction={formAction} />;
}

function RegisterFormFields({
  state,
  formAction,
}: {
  formAction: (formData: FormData) => void;
  state: RegisterFormState;
}) {
  const [values, setValues] = useState<RegisterValues>({
    confirm_password: "",
    date_of_birth: state.values.date_of_birth,
    email: state.values.email,
    full_name: state.values.full_name,
    password: "",
    terms_accepted: state.values.terms_accepted,
    user_type: state.values.user_type,
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const passwordStrength = getPasswordStrength(values.password);

  function setField<K extends keyof RegisterValues>(field: K, value: RegisterValues[K]) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  return (
    <>
      {state.errors.general ? (
        <div className="alert alert-error">
          <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
          <span>{state.errors.general}</span>
        </div>
      ) : null}

      <form action={formAction} className="register-form" id="registerForm" noValidate>
        <div className="form-group">
          <label htmlFor="full_name" className="form-label">
            <i className="fa-solid fa-user" aria-hidden="true" />
            Nombre completo
          </label>
          <div className="input-wrapper">
            <i className="fa-solid fa-user input-icon" aria-hidden="true" />
            <input
              type="text"
              id="full_name"
              name="full_name"
              className="form-input"
              placeholder="Juan Perez"
              value={values.full_name}
              onChange={(event) => setField("full_name", event.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="date_of_birth" className="form-label">
            <i className="fa-solid fa-cake-candles" aria-hidden="true" />
            Fecha de nacimiento
          </label>
          <div className="input-wrapper">
            <i className="fa-solid fa-calendar-days input-icon" aria-hidden="true" />
            <input
              type="date"
              id="date_of_birth"
              name="date_of_birth"
              className="form-input"
              value={values.date_of_birth}
              onChange={(event) => setField("date_of_birth", event.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            <i className="fa-solid fa-users" aria-hidden="true" />
            Tipo de usuario
          </label>
          <div className="user-type-selection" id="user_type_selection">
            <input
              type="radio"
              id="customer"
              name="user_type"
              value="customer"
              checked={values.user_type === "customer"}
              onChange={() => setField("user_type", "customer")}
            />
            <label htmlFor="customer" className="user-type-card">
              <i className="fa-solid fa-car" aria-hidden="true" />
              <span className="user-type-title">Cliente</span>
              <span className="user-type-desc">Busco estacionamiento</span>
            </label>

            <input
              type="radio"
              id="owner"
              name="user_type"
              value="owner"
              checked={values.user_type === "owner"}
              onChange={() => setField("user_type", "owner")}
            />
            <label htmlFor="owner" className="user-type-card">
              <i className="fa-solid fa-building" aria-hidden="true" />
              <span className="user-type-title">Propietario</span>
              <span className="user-type-desc">Ofrezco estacionamiento</span>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email" className="form-label">
            <i className="fa-solid fa-envelope" aria-hidden="true" />
            Correo electrónico
          </label>
          <div className="input-wrapper">
            <i className="fa-solid fa-envelope input-icon" aria-hidden="true" />
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              placeholder="tu@correo.com"
              value={values.email}
              onChange={(event) => setField("email", event.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">
            <i className="fa-solid fa-lock" aria-hidden="true" />
            Contrasena
          </label>
          <div className="input-wrapper">
            <i className="fa-solid fa-lock input-icon" aria-hidden="true" />
            <input
              type={passwordVisible ? "text" : "password"}
              id="password"
              name="password"
              className="form-input"
              placeholder="********"
              value={values.password}
              onChange={(event) => setField("password", event.target.value)}
            />
            <button
              type="button"
              className="toggle-password"
              data-target="password"
              aria-label={passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
              onClick={() => setPasswordVisible((current) => !current)}
            >
              <i className={`fa-solid ${passwordVisible ? "fa-eye-slash" : "fa-eye"}`} aria-hidden="true" />
            </button>
          </div>
          <div className={`password-strength ${passwordStrength}`} id="passwordStrength" />
        </div>

        <div className="form-group">
          <label htmlFor="confirm_password" className="form-label">
            <i className="fa-solid fa-lock" aria-hidden="true" />
            Confirmar contraseña
          </label>
          <div className="input-wrapper">
            <i className="fa-solid fa-lock input-icon" aria-hidden="true" />
            <input
              type={confirmPasswordVisible ? "text" : "password"}
              id="confirm_password"
              name="confirm_password"
              className="form-input"
              placeholder="********"
              value={values.confirm_password}
              onChange={(event) => setField("confirm_password", event.target.value)}
            />
            <button
              type="button"
              className="toggle-password"
              data-target="confirm_password"
              aria-label={confirmPasswordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
              onClick={() => setConfirmPasswordVisible((current) => !current)}
            >
              <i className={`fa-solid ${confirmPasswordVisible ? "fa-eye-slash" : "fa-eye"}`} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="form-group checkbox-group" id="terms_section">
          <label className="checkbox-label" htmlFor="terms_accepted">
            <input
              type="checkbox"
              id="terms_accepted"
              name="terms_accepted"
              checked={values.terms_accepted}
              onChange={(event) => setField("terms_accepted", event.target.checked)}
            />
            <span className="checkbox-custom" />
            <span className="checkbox-text">
              Acepto los{" "}
              <a href="/crud-php2/terms.php" target="_blank" rel="noreferrer">
                terminos y condiciones
              </a>
            </span>
          </label>
        </div>

        <RegisterSubmitButton />
      </form>

      <div className="register-footer">
        <p>
          ¿Ya tienes cuenta? <Link href="/login" className="login-link">Inicia sesión</Link>
        </p>
      </div>
    </>
  );
}
