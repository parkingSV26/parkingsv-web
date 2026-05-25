import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import styles from "./planes.module.css";

export const metadata: Metadata = {
  title: "Parking SV - Planes y precios",
  description: "Compara el plan gratuito y el plan premium de Parking SV.",
};

const customerPlan = {
  icon: "fa-regular fa-user",
  title: "Versión Gratis",
  subtitle: "Encuentra y reserva parqueos fácilmente.",
  label: "Versión Gratis",
  price: "$0",
  frequency: "Para todos los clientes",
  includes: [
    "Buscar parqueos disponibles",
    "Ver detalles y precios de parqueos",
    "Ver ubicaciones en el mapa",
    "Ver información del propietario",
  ],
  excludes: [
    "Reservas",
    "Experiencia sin anuncios",
    "Código QR para entrada (si está disponible)",
  ],
  note: "Los anuncios se muestran en toda la experiencia.",
} as const;

const premiumPlan = {
  icon: "fa-solid fa-crown",
  title: "Versión Premium",
  subtitle: "Más beneficios para una mejor experiencia.",
  label: "Versión Premium",
  price: "$6.99",
  frequency: "Mensual",
  includes: [
    "Experiencia sin anuncios",
    "Reservar parqueos",
    "Acceder a todos los parqueos disponibles",
    "Disponibilidad en tiempo real",
    "Código QR para entrada (si está disponible)",
    "Soporte prioritario",
  ],
  pitch:
    "Desbloquea una experiencia más cómoda, rápida y completa para reservar sin interrupciones, entrar primero a los mejores espacios y moverte con prioridad",
  note: "Solo se paga por el servicio de la plataforma.",
} as const;

export default function PlanesPage() {
  return (
    <>
      <SiteHeader activePage="none" />

      <main className={styles.page}>
        <section className={styles.hero}>
          <span className={`${styles.dotPattern} ${styles.dotPatternLeft}`} aria-hidden="true" />
          <span className={`${styles.dotPattern} ${styles.dotPatternRight}`} aria-hidden="true" />
          <span className={`${styles.glowShape} ${styles.glowShapeTopLeft}`} aria-hidden="true" />
          <span className={`${styles.glowShape} ${styles.glowShapeRight}`} aria-hidden="true" />
          <span className={`${styles.glowShape} ${styles.glowShapeBottom}`} aria-hidden="true" />

          <div className={styles.container}>
            <header className={styles.heading}>
              <h1>Planes y Precios</h1>
              <p>Elige el plan que mejor se adapte a tus necesidades.</p>
              <span className={styles.headingAccent} aria-hidden="true" />
            </header>

            <div className={styles.grid}>
              <article className={`${styles.card} ${styles.cardCustomer}`}>
                <div className={styles.cardHeader}>
                  <span className={`${styles.iconBadge} ${styles.iconBadgeCustomer}`} aria-hidden="true">
                    <i className={customerPlan.icon} />
                  </span>
                  <h2>{customerPlan.title}</h2>
                  <p>{customerPlan.subtitle}</p>
                </div>

                <div className={`${styles.priceBox} ${styles.priceBoxCustomer}`}>
                  <span>{customerPlan.label}</span>
                  <strong>{customerPlan.price}</strong>
                  <small>{customerPlan.frequency}</small>
                </div>

                <section className={styles.featureSection}>
                  <div className={styles.sectionTitle}>
                    <span className={`${styles.statusIcon} ${styles.statusIconSuccess}`} aria-hidden="true">
                      <i className="fa-solid fa-check" />
                    </span>
                    <h3>Incluye</h3>
                    <span className={styles.sectionLine} aria-hidden="true" />
                  </div>
                  <ul className={styles.featureList}>
                    {customerPlan.includes.map((feature) => (
                      <li key={feature}>
                        <span className={`${styles.listIcon} ${styles.listIconSuccess}`} aria-hidden="true">
                          <i className="fa-solid fa-check" />
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className={styles.featureSection}>
                  <div className={styles.sectionTitle}>
                    <span className={`${styles.statusIcon} ${styles.statusIconDanger}`} aria-hidden="true">
                      <i className="fa-solid fa-xmark" />
                    </span>
                    <h3>No incluye</h3>
                    <span className={`${styles.sectionLine} ${styles.sectionLineDanger}`} aria-hidden="true" />
                  </div>
                  <ul className={styles.featureList}>
                    {customerPlan.excludes.map((feature) => (
                      <li key={feature}>
                        <span className={`${styles.listIcon} ${styles.listIconDanger}`} aria-hidden="true">
                          <i className="fa-solid fa-xmark" />
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <div className={`${styles.cardNote} ${styles.cardNoteSoft}`}>
                  <i className="fa-solid fa-bullhorn" aria-hidden="true" />
                  <span>{customerPlan.note}</span>
                </div>
              </article>

              <article className={`${styles.card} ${styles.cardPremium}`}>
                <span className={styles.featuredBadge}>Recomendado</span>
                <div className={styles.cardHeader}>
                  <span className={`${styles.iconBadge} ${styles.iconBadgePremium}`} aria-hidden="true">
                    <i className={premiumPlan.icon} />
                  </span>
                  <h2>{premiumPlan.title}</h2>
                  <p>{premiumPlan.subtitle}</p>
                </div>

                <div className={`${styles.priceBox} ${styles.priceBoxFeatured}`}>
                  <span>{premiumPlan.label}</span>
                  <strong>{premiumPlan.price}</strong>
                  <small>{premiumPlan.frequency}</small>
                </div>

                <p className={styles.premiumPitch}>
                  {premiumPlan.pitch} <small>({premiumPlan.note})</small>
                </p>

                <section className={styles.featureSection}>
                  <div className={styles.sectionTitle}>
                    <span className={`${styles.statusIcon} ${styles.statusIconSuccess}`} aria-hidden="true">
                      <i className="fa-solid fa-check" />
                    </span>
                    <h3>Incluye</h3>
                    <span className={styles.sectionLine} aria-hidden="true" />
                  </div>
                  <ul className={styles.featureList}>
                    {premiumPlan.includes.map((feature) => (
                      <li key={feature}>
                        <span className={`${styles.listIcon} ${styles.listIconSuccess}`} aria-hidden="true">
                          <i className="fa-solid fa-check" />
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </article>
            </div>

            <section className={styles.commercialCard}>
              <div className={styles.commercialIcon} aria-hidden="true">
                <i className="fa-solid fa-bullhorn" />
              </div>

              <div className={styles.commercialContent}>
                <span>Espacio comercial</span>
                <h2>Anúnciate aquí</h2>
                <p>
                  Parking SV puede destacar tu negocio, servicios vehiculares y marcas locales
                  sin interrumpir la experiencia.
                </p>
              </div>

              <a
                href="mailto:parkingsv@gmail.com?subject=Quiero%20anunciarme%20en%20Parking%20SV"
                className={styles.commercialButton}
              >
                Quiero anunciarme
              </a>
            </section>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
