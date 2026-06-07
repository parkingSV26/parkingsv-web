"use server";

import type { VerifyEmailState } from "@/app/verify-email/verify-email-state";

function createState(
  email: string,
  values: Partial<VerifyEmailState> = {},
): VerifyEmailState {
  return {
    email,
    errorMessage: "",
    revision: Date.now(),
    successMessage: "",
    ...values,
  };
}

export async function resendVerificationEmailAction(
  _previousState: VerifyEmailState,
  formData: FormData,
): Promise<VerifyEmailState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    return createState(email, {
      errorMessage: "No se encontro un correo para reenviar la confirmacion.",
    });
  }

  return createState(email, {
    successMessage:
      "La confirmación de correo está desactivada por ahora. Puedes iniciar sesión directamente.",
  });
}
