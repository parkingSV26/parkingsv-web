import type { Metadata } from "next";
import SettingsBridge from "@/app/settings/SettingsBridge";
import "./globals.css";

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
    <html lang="es">
      <head>
        {/* Estas fuentes y estilos externos mantienen el look heredado del sitio mientras migra a Next. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Lato:ital,wght@0,400;0,700;1,400&family=Playfair+Display:wght@700&family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        />
      </head>
      <body className="site-body">
        {/* El fondo global vive en el layout para no repetir la misma capa decorativa en cada página. */}
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
