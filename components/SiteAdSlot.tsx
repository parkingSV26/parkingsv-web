"use client";

import Link from "next/link";
import { useSitePreferences } from "@/components/useSitePreferences";

export function SiteAdSlot() {
  const preferences = useSitePreferences();
  const copy =
    preferences.language === "en"
      ? {
          eyebrow: "Commercial space",
          title: "Advertise here",
          description:
            "Parking SV can highlight nearby businesses, vehicle services, and local brands without interrupting the experience.",
          cta: "See plans",
        }
      : {
          eyebrow: "Espacio Comercial",
          title: "Anúnciate aquí",
          description:
            "Parking SV puede destacar negocios cercanos, servicios vehiculares y marcas locales sin interrumpir la experiencia.",
          cta: "Conocer planes",
        };

  return (
    <section className="site-ad-slot">
      <div className="site-ad-slot__content">
        <span className="site-ad-slot__eyebrow">{copy.eyebrow}</span>
        <h3>{copy.title}</h3>
        <p>{copy.description}</p>
      </div>
      <Link href="/planes" className="site-ad-slot__cta">
        {copy.cta}
      </Link>
    </section>
  );
}
