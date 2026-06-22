"use server";

import { redirect } from "next/navigation";
import { createOrConfirmAuthUser, getPublicUserByEmail, upsertPublicUserProfile } from "@/app/lib/auth/user-profile";
import { resolveDefaultRouteForUserType, type UserType } from "@/app/lib/auth/user-types";
import { hashPassword } from "@/app/lib/auth/password";
import type { RegisterFormState } from "@/app/register/register-form-state";
import { getSupabaseFriendlyErrorMessage, formatSupabaseErrorForLog } from "@/src/lib/supabase/errors";
import {
  ensureSupabaseAuthReachable,
  getSupabaseConnectionErrorMessage,
} from "@/src/lib/supabase/health";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

type RegisterUserType = "" | "customer" | "owner";

function getRegisterCopy(language: string) {
  return language === "en"
    ? {
        accountExists: "An account with that email already exists. Try signing in.",
        birthDateInvalid: "Enter a valid birth date.",
        birthDateMissing: "Enter your birth date.",
        createAccountError: "An error occurred while creating your account. Please try again.",
        emailMissing: "Enter your email address.",
        passwordMismatch: "Passwords do not match.",
        passwordTooShort: "Password must be at least 8 characters long.",
        termsRequired: "Accept the terms to continue.",
        userTypeRequired: "Select whether the account is for a customer or an owner.",
      }
    : {
        accountExists: "Ya existe una cuenta con ese correo. Intenta iniciar sesion.",
        birthDateInvalid: "Ingresa una fecha de nacimiento válida.",
        birthDateMissing: "Ingresa tu fecha de nacimiento.",
        createAccountError: "Ocurrio un error al crear tu cuenta. Intenta nuevamente.",
        emailMissing: "Ingresa tu correo electronico.",
        passwordMismatch: "Las contrasenas no coinciden.",
        passwordTooShort: "La contrasena debe tener al menos 8 caracteres.",
        termsRequired: "Acepta los terminos para continuar.",
        userTypeRequired: "Selecciona si la cuenta es de cliente o propietario.",
      };
}

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

function buildLoginRedirect(email: string) {
  return `/login?registered=1&email=${encodeURIComponent(email)}`;
}

async function retrySignIn(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  email: string,
  password: string,
  attempts = 3,
) {
  let lastResult = await supabase.auth.signInWithPassword({ email, password });

  for (let attempt = 1; attempt < attempts && lastResult.error; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
    lastResult = await supabase.auth.signInWithPassword({ email, password });
  }

  return lastResult;
}

async function bootstrapRegisteredAccount(input: {
  dateOfBirth: string;
  email: string;
  fullName: string;
  password: string;
  userType: UserType;
}) {
  const authUser = await createOrConfirmAuthUser({
    dateOfBirth: input.dateOfBirth,
    email: input.email,
    fullName: input.fullName,
    password: input.password,
    userType: input.userType,
  });

  const passwordHash = await hashPassword(input.password);

  await upsertPublicUserProfile({
    authUser,
    email: input.email,
    dateOfBirth: input.dateOfBirth,
    emailVerified: true,
    fullName: input.fullName,
    passwordHash,
    userType: input.userType,
  });
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
  const language = String(formData.get("language") ?? "es");
  const copy = getRegisterCopy(language);

  const values: RegisterFormState["values"] = {
    date_of_birth,
    email,
    full_name,
    terms_accepted,
    user_type,
  };
  let redirectPath: string | null = null;
  let loginRedirectPath: string | null = null;
  let resolvedUserType: UserType = "customer";

  try {
    if (!full_name) {
      return createState(values, {
        general: language === "en" ? "Enter your full name." : "Ingresa tu nombre completo.",
      });
    }

    if (!date_of_birth) {
      return createState(values, { general: copy.birthDateMissing });
    }

    if (Number.isNaN(Date.parse(date_of_birth))) {
      return createState(values, { general: copy.birthDateInvalid });
    }

    if (!email) {
      return createState(values, { general: copy.emailMissing });
    }

    if (password.length < 8) {
      return createState(values, { general: copy.passwordTooShort });
    }

    if (password !== confirm_password) {
      return createState(values, { general: copy.passwordMismatch });
    }

    if (!terms_accepted) {
      return createState(values, { general: copy.termsRequired });
    }

    if (user_type !== "customer" && user_type !== "owner") {
      return createState(values, { general: copy.userTypeRequired });
    }

    resolvedUserType = user_type === "owner" ? "owner" : "customer";

    if (!(await ensureSupabaseAuthReachable())) {
      return createState(values, { general: getSupabaseConnectionErrorMessage() });
    }

    const existingPublicUser = await getPublicUserByEmail(email);

    if (existingPublicUser) {
      return createState(values, {
        general: copy.accountExists,
      });
    }

    await bootstrapRegisteredAccount({
      dateOfBirth: date_of_birth,
      email,
      fullName: full_name,
      password,
      userType: resolvedUserType,
    });

    const supabase = await createSupabaseServerClient();
    const signInResult = await retrySignIn(supabase, email, password);

    if (signInResult.error) {
      console.warn("Register auto-login failed.", formatSupabaseErrorForLog(signInResult.error));
      loginRedirectPath = buildLoginRedirect(email);
    } else {
      redirectPath = resolveDefaultRouteForUserType(resolvedUserType);
    }
  } catch (error) {
    console.warn("Register action failed.", formatSupabaseErrorForLog(error));
    try {
      await bootstrapRegisteredAccount({
        dateOfBirth: date_of_birth,
        email,
        fullName: full_name,
        password,
        userType: resolvedUserType,
      });
      loginRedirectPath = buildLoginRedirect(email);
    } catch (recoveryError) {
      console.warn("Register recovery failed.", formatSupabaseErrorForLog(recoveryError));
      return createState(values, {
        general: getSupabaseFriendlyErrorMessage(
          error,
          copy.createAccountError,
        ),
      });
    }
  }

  if (loginRedirectPath) {
    redirect(loginRedirectPath);
  }

  if (redirectPath) {
    redirect(redirectPath);
  }

  return createState(values);
}
