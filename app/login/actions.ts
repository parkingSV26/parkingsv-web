"use server";

import { redirect } from "next/navigation";
import {
  findDemoAccountByCredentials,
  resolveDefaultRouteForUserType,
} from "@/app/lib/auth/demo-accounts";
import { sanitizeAppRedirect } from "@/app/lib/auth/redirect";
import { createStaticDemoAccountSession } from "@/app/lib/auth/session";
import type { LoginFormState } from "@/app/login/login-form-state";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createState(
  redirectTarget: string,
  email: string,
  password: string,
  fieldErrors: LoginFormState["fieldErrors"] = {},
  errorMessage = "",
): LoginFormState {
  return {
    errorMessage,
    fieldErrors,
    redirectTarget,
    values: {
      email,
      password,
    },
    userType: null,
  };
}

export async function loginAction(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();
  const redirectTarget = sanitizeAppRedirect(String(formData.get("redirect") ?? ""));

  const fieldErrors: LoginFormState["fieldErrors"] = {};

  if (!email) {
    fieldErrors.email = "Ingresa tu correo.";
  } else if (!emailPattern.test(email)) {
    fieldErrors.email = "Ingresa un correo valido.";
  }

  if (!password) {
    fieldErrors.password = "Ingresa tu contrasena.";
  } else if (password.length < 8) {
    fieldErrors.password = "La contrasena debe tener al menos 8 caracteres.";
  }

  if (fieldErrors.email || fieldErrors.password) {
    return createState(redirectTarget, email, password, fieldErrors);
  }

  // Por ahora validamos contra cuentas demo fijas para no acoplar la UX a una tabla incompleta.
  const account = findDemoAccountByCredentials(email, password);

  if (!account) {
    return createState(
      redirectTarget,
      email,
      password,
      {},
      "Correo o contrasena incorrectos. Revisa las credenciales e intenta nuevamente.",
    );
  }

  await createStaticDemoAccountSession(account.userType);

  // Si el redirect sigue siendo el default, lo ajustamos según el tipo de cuenta.
  redirect(
    redirectTarget === "/parqueos"
      ? resolveDefaultRouteForUserType(account.userType)
      : redirectTarget,
  );
}
