import "server-only";

import nodemailer from "nodemailer";

type EmailPayload = {
  html: string;
  subject: string;
  toEmail: string;
  toName?: string;
};

function readSmtpConfig() {
  // Leemos todo desde variables de entorno para no acoplar la app a un proveedor específico.
  const host = process.env.SMTP_HOST?.trim();
  const fromEmail = process.env.SMTP_FROM_EMAIL?.trim();
  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure = String(process.env.SMTP_SECURE ?? "").toLowerCase() === "true";
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD?.trim();
  const fromName = process.env.SMTP_FROM_NAME?.trim() || "Parking SV";

  if (!host || !fromEmail) {
    return null;
  }

  return {
    auth: user && password ? { pass: password, user } : undefined,
    fromEmail,
    fromName,
    host,
    port,
    secure,
  };
}

export function isEmailConfigured() {
  return readSmtpConfig() !== null;
}

export async function sendTransactionalEmail({
  html,
  subject,
  toEmail,
  toName,
}: EmailPayload) {
  const smtpConfig = readSmtpConfig();

  if (!smtpConfig) {
    console.error("SMTP is not configured. Missing SMTP_HOST or SMTP_FROM_EMAIL.");
    return false;
  }

  try {
    // El transport se crea al vuelo porque este proyecto aún usa un flujo de correo bastante puntual.
    const transporter = nodemailer.createTransport({
      auth: smtpConfig.auth,
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
    });

    await transporter.sendMail({
      from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
      html,
      subject,
      text: html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      to: toName ? `"${toName}" <${toEmail}>` : toEmail,
    });

    return true;
  } catch (error) {
    console.error("Failed to send transactional email.", error);
    return false;
  }
}
