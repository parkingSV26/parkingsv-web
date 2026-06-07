"use server";

import { redirect } from "next/navigation";
import { createOrConfirmAuthUser, getPublicUserByEmail, upsertPublicUserProfile } from "@/app/lib/auth/user-profile";
import { resolveDefaultRouteForUserType } from "@/app/lib/auth/user-types";
import { hashPassword } from "@/app/lib/auth/password";
import type { RegisterFormState } from "@/app/register/register-form-state";
import { getSupabaseFriendlyErrorMessage, formatSupabaseErrorForLog } from "@/src/lib/supabase/errors";
import {
  ensureSupabaseAuthReachable,
  getSupabaseConnectionErrorMessage,
} from "@/src/lib/supabase/health";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

type RegisterUserType = "" | "customer" | "owner";

const DEFAULT_VALUES: RegisterFormState["values"] = {
  date_of_birth: "",
  email: "",
  full_name: "",
  terms_accepted: false,
  user_type: "",
};

function createState(
  values: Partial<RegisterFormState["values"]> = {},
  errors: RegisterFormState["errors"] = {},
): RegisterFormState {
  return {
    errors,
    values: {
      ...DEFAULT_VALUES,
      ...values,
    },
  };
}

export async function registerAction(
  _previousState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const full_name = String(formData.get("full_name") ?? "").trim();
  const date_of_birth = String(formData.get("date_of_birth") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();
  const confirm_password = String(formData.get("confirm_password") ?? "").trim();
  const user_type = String(formData.get("user_type") ?? "") as RegisterUserType;
  const terms_accepted = formData.get("terms_accepted") === "on";

  const values: RegisterFormState["values"] = {
    date_of_birth,
    email,
    full_name,
    terms_accepted,
    user_type,
  };
  let redirectPath: string | null = null;

  try {
    if (!full_name) {
      return createState(values, { general: "Ingresa tu nombre completo." });
    }

    if (!date_of_birth) {
      return createState(values, { general: "Ingresa tu fecha de nacimiento." });
    }

    if (Number.isNaN(Date.parse(date_of_birth))) {
      return createState(values, { general: "Ingresa una fecha de nacimiento válida." });
    }

    if (!email) {
      return createState(values, { general: "Ingresa tu correo electronico." });
    }

    if (password.length < 8) {
      return createState(values, { general: "La contrasena debe tener al menos 8 caracteres." });
    }

    if (password !== confirm_password) {
      return createState(values, { general: "Las contrasenas no coinciden." });
    }

    if (!terms_accepted) {
      return createState(values, { general: "Acepta los terminos para continuar." });
    }

    if (user_type !== "customer" && user_type !== "owner") {
      return createState(values, { general: "Selecciona si la cuenta es de cliente o propietario." });
    }

    if (!(await ensureSupabaseAuthReachable())) {
      return createState(values, { general: getSupabaseConnectionErrorMessage() });
    }

    const existingPublicUser = await getPublicUserByEmail(email);

    if (existingPublicUser) {
      return createState(values, {
        general: "Ya existe una cuenta con ese correo. Intenta iniciar sesion.",
      });
    }

    const authUser = await createOrConfirmAuthUser({
      dateOfBirth: date_of_birth,
      email,
      fullName: full_name,
      password,
      userType: user_type,
    });

    const passwordHash = await hashPassword(password);
    await upsertPublicUserProfile({
      authUser,
      email,
      dateOfBirth: date_of_birth,
      emailVerified: true,
      fullName: full_name,
      passwordHash,
      userType: user_type,
    });

    const supabase = await createSupabaseServerClient();
    const signInResult = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInResult.error) {
      return createState(values, {
        general: getSupabaseFriendlyErrorMessage(
          signInResult.error,
          "Ocurrio un error al crear la sesion. Intenta nuevamente.",
        ),
      });
    }

    redirectPath = resolveDefaultRouteForUserType(user_type);
  } catch (error) {
    console.warn("Register action failed.", formatSupabaseErrorForLog(error));
    return createState(values, {
      general: getSupabaseFriendlyErrorMessage(
        error,
        "Ocurrio un error al crear la sesion. Intenta nuevamente.",
      ),
    });
  }

  if (redirectPath) {
    redirect(redirectPath);
  }

  return createState(values);
}
