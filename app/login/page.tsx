import type { Metadata } from "next";
import { sanitizeAppRedirect } from "@/app/lib/auth/redirect";
import LoginPageClient from "@/app/login/LoginPageClient";

export const metadata: Metadata = {
  title: "Parking SV - Iniciar sesion",
  description: "Accede a tus reservas, favoritos y parqueos publicados desde una pagina dedicada.",
};

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectTarget = sanitizeAppRedirect(readFirst(params.redirect));
  const registrationEmail = readFirst(params.email);
  const wasRegistered = readFirst(params.registered) === "1";

  return (
    <LoginPageClient
      initialEmail={registrationEmail}
      redirectTarget={redirectTarget}
      wasRegistered={wasRegistered}
    />
  );
}

function readFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}
