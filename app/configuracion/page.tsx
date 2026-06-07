import type { Metadata } from "next";
import SettingsPage from "@/app/settings/page";

export const metadata: Metadata = {
  title: "Parking SV - Configuración",
  description: "Réplica en Next.js de la página de configuración con vista previa inmediata.",
};

export const dynamic = "force-dynamic";

export default SettingsPage;
