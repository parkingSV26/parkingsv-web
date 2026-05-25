import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import GuardadosClient from "./GuardadosClient";

export const metadata: Metadata = {
  title: "Parking SV - Guardados",
  description: "Biblioteca personal para organizar parqueos guardados y carpetas favoritas.",
};

export default function GuardadosPage() {
  return (
    <>
      <SiteHeader activePage="none" />
      <main>
        {/* Toda la lógica de carpetas y favoritos queda en cliente porque depende de localStorage. */}
        <GuardadosClient />
      </main>
      <SiteFooter />
    </>
  );
}
