import type { Metadata } from "next";
import AboutUsClient from "@/app/about-us/AboutUsClient";

export const metadata: Metadata = {
  title: "Parking SV - Sobre nosotros",
  description: "Conoce la historia, misión y visión de Parking SV.",
};

export default function AboutUsPage() {
  return <AboutUsClient />;
}
