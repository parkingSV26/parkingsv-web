"use server";

import { redirect } from "next/navigation";
import { createDemoUserSession, getSessionUser } from "@/app/lib/auth/session";
import type { RegisterFormState } from "@/app/register/register-form-state";

type RegisterUserType = "" | "customer" | "owner";

const DEFAULT_VALUES: RegisterFormState["values"] = {
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

function getDemoIdentity(values: {
  email: string;
  fullName: string;
  password: string;
}) {
  // Esta identidad simple nos permite crear una sesión demo repetible sin depender aún de una tabla de usuarios real.
  const baseValue = values.email || values.fullName || values.password || "usuario";
  const normalizedValue = baseValue
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9._-]/g, "");

  return normalizedValue || "usuario";
}

export async function registerAction(
  _previousState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const currentUser = await getSessionUser();

  if (currentUser) {
    redirect("/mi-cuenta");
  }

  const full_name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();
  const user_type = String(formData.get("user_type") ?? "") as RegisterUserType;
  const terms_accepted = formData.get("terms_accepted") === "on";

  const values: RegisterFormState["values"] = {
    email,
    full_name,
    terms_accepted,
    user_type,
  };

  try {
    // El registro actual crea una sesión demo directa para que el flujo completo sea navegable.
    await createDemoUserSession(getDemoIdentity({ email, fullName: full_name, password }), {
      fullName: full_name || "Usuario Parking SV",
      userType: user_type === "owner" ? "owner" : "customer",
    });

    redirect("/mi-cuenta");
  } catch (error) {
    return createState(values, {
      general:
        error instanceof Error
          ? error.message
          : "Ocurrio un error al crear la sesion. Intenta nuevamente.",
    });
  }
}
