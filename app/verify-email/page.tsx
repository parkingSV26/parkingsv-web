import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Parking SV - Verificar correo",
  description: "Confirma tu cuenta de Parking SV desde el enlace enviado a tu correo.",
};

type VerifyEmailPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  await searchParams;
  redirect("/login");
}
