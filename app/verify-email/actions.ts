"use server";

import { db, type DatabaseRow } from "@/app/lib/db";
import { createUserSession } from "@/app/lib/auth/session";
import {
  clearPendingVerificationSession,
  createVerificationCode,
  getLatestVerificationRecord,
  getMaxVerificationAttempts,
  getVerificationStatus,
  readPendingVerificationSession,
  sendVerificationCodeEmail,
  setPendingVerificationSession,
} from "@/app/lib/auth/verification";
import type { VerifyEmailState } from "@/app/verify-email/verify-email-state";

type PendingUserRow = DatabaseRow & {
  full_name: string;
};

type MatchingCodeRow = DatabaseRow & {
  code: string;
};

function createState(
  values?: Partial<VerifyEmailState>,
): VerifyEmailState {
  return {
    codeError: "",
    generalError: "",
    isExpired: false,
    remainingAttempts: getMaxVerificationAttempts(),
    resendSuccess: "",
    revision: Date.now(),
    success: false,
    ...values,
  };
}

export async function verifyEmailAction(
  previousState: VerifyEmailState,
  formData: FormData,
): Promise<VerifyEmailState> {
  // Toda la validación depende de la cookie firmada, no de valores confiados al cliente.
  const pendingVerification = await readPendingVerificationSession();

  if (!pendingVerification) {
    return createState({
      generalError:
        "La verificación pendiente ya no está disponible. Vuelve a registrarte para generar un nuevo código.",
      isExpired: true,
      remainingAttempts: 0,
    });
  }

  const intent = String(formData.get("intent") ?? "verify_code");

  if (intent === "resend_code") {
    // Al reenviar reemplazamos cualquier código previo para dejar un único token activo.
    const [users] = await db.execute<PendingUserRow[]>(
      `
        SELECT full_name
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [pendingVerification.userId],
    );

    const pendingUser = users[0];

    if (!pendingUser) {
      return createState({
        generalError: "No se encontró el usuario asociado a esta verificación.",
        remainingAttempts: previousState.remainingAttempts,
      });
    }

    const verificationCode = createVerificationCode();
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();
      await connection.execute("DELETE FROM verifications WHERE email = ?", [
        pendingVerification.email,
      ]);
      await connection.execute(
        `
          INSERT INTO verifications (email, code, created_at, attempts)
          VALUES (?, ?, NOW(), 0)
        `,
        [pendingVerification.email, verificationCode],
      );

      const emailSent = await sendVerificationCodeEmail({
        code: verificationCode,
        email: pendingVerification.email,
        fullName: pendingUser.full_name,
        variant: "resend",
      });

      if (!emailSent) {
        throw new Error(
          "Error al enviar el código. Revisa la configuración SMTP e intenta nuevamente.",
        );
      }

      await connection.commit();
      await setPendingVerificationSession(pendingVerification.userId, pendingVerification.email);

      return createState({
        remainingAttempts: getMaxVerificationAttempts(),
        resendSuccess: "Código reenviado exitosamente. Revisa tu bandeja de entrada.",
      });
    } catch (error) {
      await connection.rollback();

      return createState({
        generalError:
          error instanceof Error
            ? error.message
            : "Error al reenviar el código. Intenta nuevamente.",
        remainingAttempts: previousState.remainingAttempts,
      });
    } finally {
      connection.release();
    }
  }

  const code = String(formData.get("code") ?? "").trim();

  if (!code) {
    return createState({
      codeError: "Por favor, ingresa el código de verificación.",
      remainingAttempts: previousState.remainingAttempts,
    });
  }

  if (!/^\d{6}$/.test(code)) {
    return createState({
      codeError: "El código debe tener 6 dígitos.",
      remainingAttempts: previousState.remainingAttempts,
    });
  }

  const status = await getVerificationStatus(pendingVerification.email);

  if (status.isExpired) {
    return createState({
      codeError: "El código ha expirado. Solicita uno nuevo.",
      isExpired: true,
      remainingAttempts: status.remainingAttempts,
    });
  }

  if (status.attempts >= getMaxVerificationAttempts()) {
    return createState({
      codeError: "Has superado el número máximo de intentos. Solicita un nuevo código.",
      remainingAttempts: 0,
    });
  }

  const latestVerification = await getLatestVerificationRecord(pendingVerification.email);

  if (!latestVerification) {
    return createState({
      codeError: "No se encontró un código activo para esta cuenta.",
      isExpired: true,
      remainingAttempts: 0,
    });
  }

  const [matchingCodes] = await db.execute<MatchingCodeRow[]>(
    `
      SELECT code
      FROM verifications
      WHERE email = ?
        AND code = ?
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [pendingVerification.email, code],
  );

  if (!matchingCodes[0]) {
    await db.execute(
      `
        UPDATE verifications
        SET attempts = attempts + 1
        WHERE email = ?
      `,
      [pendingVerification.email],
    );

    const usedAttempts = status.attempts + 1;
    const remainingAttempts = Math.max(0, getMaxVerificationAttempts() - usedAttempts);

    return createState({
      codeError:
        remainingAttempts > 0
          ? `Código incorrecto. Te quedan ${remainingAttempts} intento(s).`
          : "Has superado el número máximo de intentos. Solicita un nuevo código.",
      remainingAttempts,
    });
  }

  const connection = await db.getConnection();

  try {
    // Marcamos el correo como verificado y limpiamos códigos en una sola transacción.
    await connection.beginTransaction();
    await connection.execute(
      `
        UPDATE users
        SET email_verified = 1, email_verified_at = NOW()
        WHERE id = ?
      `,
      [pendingVerification.userId],
    );
    await connection.execute("DELETE FROM verifications WHERE email = ?", [
      pendingVerification.email,
    ]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();

    return createState({
      generalError:
        error instanceof Error
          ? error.message
          : "Error al verificar la cuenta. Intenta nuevamente.",
      remainingAttempts: status.remainingAttempts,
    });
  } finally {
    connection.release();
  }

  await clearPendingVerificationSession();
  await createUserSession(pendingVerification.userId);

  return createState({
    remainingAttempts: getMaxVerificationAttempts(),
    success: true,
  });
}
