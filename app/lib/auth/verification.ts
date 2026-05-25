import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db, type DatabaseRow } from "@/app/lib/db";
import { sendTransactionalEmail } from "@/app/lib/email";

const PENDING_VERIFICATION_COOKIE = "parking_sv_pending_verification";
const PENDING_VERIFICATION_MAX_AGE = 60 * 10;
const MAX_VERIFICATION_ATTEMPTS = 3;
const VERIFICATION_EXPIRY_MINUTES = 10;
const FALLBACK_VERIFICATION_SECRET = "parking-sv-local-verification-secret";

type PendingVerificationPayload = {
  email: string;
  expiresAt: number;
  userId: number;
};

type VerificationRow = DatabaseRow & {
  attempts: number | null;
  code: string | null;
  created_at: Date | string | null;
};

function getVerificationSecret() {
  return (
    process.env.PENDING_VERIFICATION_SECRET ??
    process.env.SESSION_SECRET ??
    FALLBACK_VERIFICATION_SECRET
  );
}

function signVerificationPayload(encodedPayload: string) {
  // Firmamos la cookie temporal para evitar que el navegador altere el usuario o la expiración.
  return createHmac("sha256", getVerificationSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function encodePendingVerification(payload: PendingVerificationPayload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signVerificationPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function decodePendingVerification(value: string) {
  const [encodedPayload, signature] = value.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signVerificationPayload(encodedPayload);
  const providedSignature = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (providedSignature.length !== expectedSignatureBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(providedSignature, expectedSignatureBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as PendingVerificationPayload;

    if (
      typeof payload.email !== "string" ||
      typeof payload.expiresAt !== "number" ||
      typeof payload.userId !== "number"
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function buildVerificationEmailTemplate(
  fullName: string,
  code: string,
  variant: "register" | "resend",
) {
  // El template es deliberadamente simple para que funcione bien en la mayoría de clientes de correo.
  const subject =
    variant === "resend"
      ? "Nuevo código de verificación - Parking SV"
      : "Verifica tu cuenta - Parking SV";
  const heading =
    variant === "resend" ? "Nuevo código de verificación" : "Bienvenido a Parking SV";
  const intro =
    variant === "resend"
      ? "Has solicitado un nuevo código de verificación:"
      : "Gracias por registrarte. Tu código de verificación es:";

  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0C6FF9;">${heading}</h2>
        <p>Hola <strong>${fullName}</strong>,</p>
        <p>${intro}</p>
        <div style="background: #f5f7fa; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="color: #0C6FF9; font-size: 32px; letter-spacing: 5px; margin: 0;">${code}</h1>
        </div>
        <p>Este código expirará en <strong>10 minutos</strong>.</p>
        <p>Si no solicitaste esta accion, ignora este mensaje.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">Parking SV - Sistema de Gestión de Estacionamientos</p>
      </div>
    `,
    subject,
  };
}

function normalizeVerificationDate(value: Date | string | null) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function createVerificationCode() {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
}

export function hasVerificationExpired(createdAt: Date | string | null) {
  const verificationDate = normalizeVerificationDate(createdAt);

  // Si la fecha no puede leerse, preferimos tratar el código como vencido por seguridad.
  if (!verificationDate) {
    return true;
  }

  const elapsedMinutes = (Date.now() - verificationDate.getTime()) / 60_000;
  return elapsedMinutes > VERIFICATION_EXPIRY_MINUTES;
}

export async function getLatestVerificationRecord(email: string) {
  const [rows] = await db.execute<VerificationRow[]>(
    `
      SELECT code, created_at, attempts
      FROM verifications
      WHERE email = ?
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [email],
  );

  return rows[0] ?? null;
}

export async function getVerificationStatus(email: string) {
  const verification = await getLatestVerificationRecord(email);
  const attempts = Number(verification?.attempts ?? 0);
  const isExpired = hasVerificationExpired(verification?.created_at ?? null);

  return {
    attempts,
    isExpired,
    remainingAttempts: Math.max(0, MAX_VERIFICATION_ATTEMPTS - attempts),
    verification,
  };
}

export async function sendVerificationCodeEmail(options: {
  code: string;
  email: string;
  fullName: string;
  variant: "register" | "resend";
}) {
  const template = buildVerificationEmailTemplate(
    options.fullName,
    options.code,
    options.variant,
  );

  return sendTransactionalEmail({
    html: template.html,
    subject: template.subject,
    toEmail: options.email,
    toName: options.fullName,
  });
}

export async function setPendingVerificationSession(userId: number, email: string) {
  const cookieStore = await cookies();
  const payload: PendingVerificationPayload = {
    email,
    expiresAt: Date.now() + PENDING_VERIFICATION_MAX_AGE * 1000,
    userId,
  };

  cookieStore.set({
    httpOnly: true,
    maxAge: PENDING_VERIFICATION_MAX_AGE,
    name: PENDING_VERIFICATION_COOKIE,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    value: encodePendingVerification(payload),
  });
}

export async function readPendingVerificationSession() {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(PENDING_VERIFICATION_COOKIE)?.value;

  if (!rawValue) {
    return null;
  }

  const payload = decodePendingVerification(rawValue);

  if (!payload || payload.expiresAt <= Date.now()) {
    return null;
  }

  return payload;
}

export async function clearPendingVerificationSession() {
  const cookieStore = await cookies();
  cookieStore.delete(PENDING_VERIFICATION_COOKIE);
}

export function getMaxVerificationAttempts() {
  return MAX_VERIFICATION_ATTEMPTS;
}
