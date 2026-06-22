import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/app/lib/auth/session";
import AnunciarseClient from "./AnunciarseClient";

export const metadata: Metadata = {
  title: "Parking SV - Anúnciate aquí",
  description: "Envía una solicitud para anunciar tu negocio en Parking SV.",
};

export const dynamic = "force-dynamic";

export default async function AnunciarsePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login?redirect=%2Fanunciarse");
  }

  return (
    <AnunciarseClient
      user={{
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
      }}
    />
  );
}
