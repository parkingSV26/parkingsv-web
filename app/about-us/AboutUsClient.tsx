"use client";

/* eslint-disable @next/next/no-img-element */

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { useSitePreferences } from "@/components/useSitePreferences";

const contactLinks = [
  {
    icon: "fas fa-phone",
    label: "+503 6934 4318",
    href: "tel:+50369344318",
  },
  {
    icon: "fab fa-instagram",
    label: "@ParkingSV",
    href: "https://instagram.com/ParkingSV",
  },
  {
    icon: "fas fa-envelope",
    label: "parkingsv@gmail.com",
    href: "mailto:parkingsv@gmail.com",
  },
] as const;

export default function AboutUsClient() {
  const preferences = useSitePreferences();
  const copy =
    preferences.language === "en"
      ? {
          body:
            "We are a group of young people committed to driving change in our community and contributing to the sustainable growth of El Salvador. Our goal is to use technology as a tool to solve real problems, promoting innovative solutions that improve quality of life and foster a more organized, safe, and connected environment.",
          contact: "Contact us!",
          mission:
            "Make urban mobility easier with a secure platform to reserve and share parking spaces, optimizing resources and reducing traffic and pollution.",
          sectionTitle: "Who are we?",
          vision:
            "Become the leading solution in intelligent parking management, creating sustainable and connected communities with access available anytime, anywhere.",
        }
      : {
          body:
            "Somos un grupo de jóvenes comprometidos con impulsar el cambio en nuestra comunidad y contribuir con el crecimiento sostenible de El Salvador. Nuestra meta es utilizar la tecnología como herramienta para resolver problemas reales, promoviendo soluciones innovadoras que mejoren la calidad de vida de las personas y fomenten un entorno más ordenado, seguro y conectado.",
          contact: "¡Contáctanos!",
          mission:
            "Facilitar la movilidad urbana con una plataforma segura para reservar y compartir parqueos, optimizando recursos y reduciendo tráfico y contaminación.",
          sectionTitle: "¿Quiénes somos?",
          vision:
            "Ser la solución líder en gestión inteligente de parqueos, creando comunidades sostenibles y conectadas con acceso disponible en todo momento y lugar.",
        };

  return (
    <>
      <SiteHeader activePage="about" />

      <main className="about-page about-page-original">
        <section className="section about card about-main-card">
          <h2>{copy.sectionTitle}</h2>
          <p className="text">{copy.body}</p>
          <img src="/parkingsv/team-group.jpg" alt="Foto del equipo Parking SV" className="equipo-img" />
        </section>

        <section className="section mission-vision">
          <div className="card">
            <i className="fas fa-bullseye" aria-hidden="true" />
            <h3>{preferences.language === "en" ? "Mission" : "¡Misión!"}</h3>
            <p>{copy.mission}</p>
          </div>
          <div className="card">
            <i className="fas fa-lightbulb" aria-hidden="true" />
            <h3>{preferences.language === "en" ? "Vision" : "¡Visión!"}</h3>
            <p>{copy.vision}</p>
          </div>
        </section>

        <section className="section card about-contact-original">
          <h3>{copy.contact}</h3>
          <div className="contact-info">
            {contactLinks.map((contact) => (
              <a key={contact.href} href={contact.href}>
                <i className={contact.icon} aria-hidden="true" /> {contact.label}
              </a>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
