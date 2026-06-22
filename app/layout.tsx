import type { Metadata } from "next";
import { Inter, Lato, Playfair_Display, Poppins } from "next/font/google";
import SettingsBridge from "@/app/settings/SettingsBridge";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const lato = Lato({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lato",
  weight: ["400", "700"],
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair-display",
  weight: ["700"],
});

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Parking SV",
  description: "Parking SV - Sistema de Gestión de Estacionamientos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${lato.variable} ${playfairDisplay.variable} ${poppins.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        />
      </head>
      <body className="site-body">
        {/* Keep the global background here so we do not repeat the same decorative layer on every page. */}
        <div className="site-global-background" aria-hidden="true">
          <span className="site-dot-pattern site-dot-pattern-left" />
          <span className="site-dot-pattern site-dot-pattern-right" />
          <span className="site-glow-shape site-glow-shape-top-left" />
          <span className="site-glow-shape site-glow-shape-right" />
          <span className="site-glow-shape site-glow-shape-bottom" />
        </div>
        <div className="site-app-shell">
          <SettingsBridge />
          {children}
        </div>
      </body>
    </html>
  );
}
