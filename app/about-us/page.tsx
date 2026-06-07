/* eslint-disable @next/next/no-img-element */
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

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

export default function AboutUsPage() {
  return (
    <>
      <SiteHeader activePage="about" />

      <main className="about-page about-page-original">
        <section className="section about card about-main-card">
          <h2>
            <span>¿Quiénes</span> somos?
          </h2>
          <p className="text">
            Somos un grupo de jóvenes comprometidos con impulsar el cambio en nuestra comunidad y
            contribuir al crecimiento sostenible de El Salvador. Nuestra meta es utilizar la
            tecnología como herramienta para resolver problemas reales, promoviendo soluciones
            innovadoras que mejoren la calidad de vida de las personas y fomenten un entorno más
            ordenado, seguro y conectado.
          </p>
          <img src="/parkingsv/team-group.jpg" alt="Foto del equipo Parking SV" className="equipo-img" />
        </section>

        <section className="section mission-vision">
          <div className="card">
            <i className="fas fa-bullseye" aria-hidden="true" />
            <h3>¡Misión!</h3>
            <p>
              Facilitar la movilidad urbana con una plataforma segura para reservar y compartir
              parqueos, optimizando recursos y reduciendo tráfico y contaminación.
            </p>
          </div>
          <div className="card">
            <i className="fas fa-lightbulb" aria-hidden="true" />
            <h3>¡Visión!</h3>
            <p>
              Ser la solución líder en gestión inteligente de parqueos, creando comunidades
              sostenibles y conectadas con acceso disponible en todo momento y lugar.
            </p>
          </div>
        </section>

        <section className="section card about-contact-original">
          <h3>¡Contáctanos!</h3>
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
