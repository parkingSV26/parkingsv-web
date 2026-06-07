"use server";

import { redirect } from "next/navigation";
import { getPublicUserByEmail } from "@/app/lib/auth/user-profile";
import { createOrConfirmAuthUser } from "@/app/lib/auth/user-profile";
import { sanitizeAppRedirect } from "@/app/lib/auth/redirect";
import { resolveDefaultRouteForUserType } from "@/app/lib/auth/user-types";
import { verifyPassword } from "@/app/lib/auth/password";
import type { LoginFormState } from "@/app/login/login-form-state";
import { getSupabaseFriendlyErrorMessage, formatSupabaseErrorForLog } from "@/src/lib/supabase/errors";
import {
  ensureSupabaseAuthReachable,
  getSupabaseConnectionErrorMessage,
} from "@/src/lib/supabase/health";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

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
  let redirectPath: string | null = null;

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

  if (!(await ensureSupabaseAuthReachable())) {
    return createState(redirectTarget, email, password, {}, getSupabaseConnectionErrorMessage());
  }

  try {
    const supabase = await createSupabaseServerClient();
    const signInResult = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInResult.error) {
      const shouldRepairAccount = /confirm|verified|email|invalid login credentials/i.test(
        signInResult.error.message,
      );

      if (shouldRepairAccount) {
        const publicUser = await getPublicUserByEmail(email);

        if (publicUser?.passwordHash) {
          const passwordMatches = await verifyPassword(password, publicUser.passwordHash);

          if (passwordMatches) {
            await createOrConfirmAuthUser({
              dateOfBirth: publicUser.dateOfBirth,
              email,
              fullName: publicUser.fullName,
              password,
              userType: publicUser.userType,
            });

            const retryResult = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (!retryResult.error) {
              const publicUserAfter = await getPublicUserByEmail(email);
              const userType = publicUserAfter?.userType ?? "customer";
              redirectPath =
                redirectTarget === "/parqueos"
                  ? resolveDefaultRouteForUserType(userType)
                  : redirectTarget;
            }
          }
        }
      }

      if (!redirectPath) {
        return createState(
          redirectTarget,
          email,
          password,
          {},
          "Correo o contrasena incorrectos. Revisa las credenciales e intenta nuevamente.",
        );
      }
    }

    const publicUser = await getPublicUserByEmail(email);
    const userType = publicUser?.userType ?? "customer";
    redirectPath =
      redirectTarget === "/parqueos"
        ? resolveDefaultRouteForUserType(userType)
        : redirectTarget;
  } catch (error) {
    console.warn("Login action failed.", formatSupabaseErrorForLog(error));
    return createState(
      sanitizeAppRedirect(String(formData.get("redirect") ?? "")),
      String(formData.get("email") ?? "").trim().toLowerCase(),
      String(formData.get("password") ?? "").trim(),
      {},
      getSupabaseFriendlyErrorMessage(error, "No se pudo iniciar sesion. Intenta nuevamente."),
    );
  }

  if (redirectPath) {
    redirect(redirectPath);
  }

  return createState(redirectTarget, email, password);
}
