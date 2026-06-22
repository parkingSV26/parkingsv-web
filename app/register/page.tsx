import type { Metadata } from "next";
import RegisterPageClient from "@/app/register/RegisterPageClient";

export const metadata: Metadata = {
  title: "Parking SV - Crear cuenta",
  description: "Crea tu cuenta de Parking SV desde la versión en Next.js.",
};

export default function RegisterPage() {
  return <RegisterPageClient />;
}
