import type { NextConfig } from "next";

function getSupabaseImagePattern() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required to allow Supabase storage images.");
  }

  const url = new URL(supabaseUrl);

  return {
    hostname: url.hostname,
    pathname: "/storage/v1/object/public/**",
    port: url.port,
    protocol: url.protocol.replace(":", "") as "http" | "https",
  };
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [getSupabaseImagePattern()],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "45mb",
    },
  },
  async rewrites() {
    return [
      { source: "/configuracion", destination: "/settings" },
      { source: "/guardados", destination: "/saved" },
      { source: "/guardados/carpeta/:id", destination: "/saved/folder/:id" },
      { source: "/mi-cuenta", destination: "/account" },
      { source: "/mis-parqueos", destination: "/my-parkings" },
      {
        source: "/mis-parqueos/:parkingId/reservas",
        destination: "/my-parkings/:parkingId/reservations",
      },
      {
        source: "/mis-parqueos/:parkingId/editar",
        destination: "/my-parkings/:parkingId/editar",
      },
      { source: "/mis-reservas", destination: "/my-reservations" },
      { source: "/notificaciones", destination: "/notifications" },
      { source: "/parqueos", destination: "/parkings" },
      { source: "/parqueos/:slug", destination: "/parkings/:slug" },
      { source: "/parqueos-publicados", destination: "/published-parkings" },
      { source: "/planes", destination: "/plans" },
      { source: "/publicar-parqueo", destination: "/publish-parking" },
      { source: "/sobre-nosotros", destination: "/about-us" },
    ];
  },
};

export default nextConfig;
