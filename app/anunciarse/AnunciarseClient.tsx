"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { useSitePreferences } from "@/components/useSitePreferences";
import { submitAnnouncementRequestAction } from "./actions";
import { initialAnunciarseFormState } from "./anunciarse-form-state";
import styles from "./anunciarse.module.css";

type AnnouncementPageClientProps = {
  user: {
    email: string;
    fullName: string;
    phoneNumber: string | null;
  };
};

type FormValues = {
  budget_range: string;
  business_category: string;
  business_name: string;
  campaign_goal: string;
  description: string;
  preferred_contact: string;
  terms_accepted: boolean;
  website_or_social: string;
};

const defaultValues: FormValues = {
  budget_range: "sin_definir",
  business_category: "",
  business_name: "",
  campaign_goal: "",
  description: "",
  preferred_contact: "email",
  terms_accepted: false,
  website_or_social: "",
};

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={styles.submitButton} disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

export default function AnunciarseClient({ user }: AnnouncementPageClientProps) {
  const preferences = useSitePreferences();
  const [state, formAction] = useActionState(submitAnnouncementRequestAction, initialAnunciarseFormState);
  const [values, setValues] = useState<FormValues>(defaultValues);

  const copy =
    preferences.language === "en"
      ? {
          audience: "Tell us what you want to promote",
          audienceDesc: "We review every request and reply within 7 days.",
          budgetLabel: "Budget range",
          budgetOptions: {
            flexible: "No fixed budget yet",
            low: "Less than $100",
            mid: "$100 - $250",
            high: "$250 - $500",
            premium: "$500+",
          },
          businessLabel: "Business / project name",
          businessPlaceholder: "Your brand or project name",
          categoryLabel: "Business category",
          categoryOptions: {
            carwash: "Car wash",
            restaurant: "Restaurant",
            service: "Service",
            shop: "Store",
            tourism: "Tourism",
            workshop: "Workshop",
            other: "Other",
          },
          contactBlockTitle: "Your account details",
          contactMethodLabel: "Preferred contact",
          contactMethodOptions: {
            email: "Email",
            whatsapp: "WhatsApp",
            call: "Phone call",
          },
          descriptionLabel: "What do you want to advertise?",
          descriptionPlaceholder:
            "Tell us what you sell, who you want to reach, and where you'd like your ad to appear.",
          goalLabel: "Campaign goal",
          goalOptions: {
            awareness: "More visibility",
            leads: "More leads",
            reservations: "More reservations",
            sales: "More sales",
            traffic: "More visits",
            other: "Other",
          },
          headline: "Advertise in Parking SV",
          intro:
            "Send us a simple request with your account and the details of your business. We will review it and reply within one week.",
          introBullets: ["Protected access", "Simple form", "Reply in 7 days"],
          loginHint: "You are already signed in with your Parking SV account.",
          note:
            "By sending this form, you accept the terms and authorize us to contact you about your request.",
          pageTitle: "Advertise here",
          phoneLabel: "Phone number",
          sendLabel: "Send request",
          sendingLabel: "Sending...",
          socialLabel: "Website or social profile",
          socialPlaceholder: "https://instagram.com/yourbrand",
          successTitle: "Request sent",
          termsLabel:
            "I accept the terms and conditions and agree to receive a response within 7 days.",
        }
      : {
          audience: "Cuéntanos qué quieres promocionar",
          audienceDesc: "Revisamos cada solicitud y respondemos en 7 días.",
          budgetLabel: "Rango de inversión",
          budgetOptions: {
            flexible: "Todavía no tengo presupuesto fijo",
            low: "Menos de $100",
            mid: "$100 - $250",
            high: "$250 - $500",
            premium: "$500+",
          },
          businessLabel: "Nombre del negocio / proyecto",
          businessPlaceholder: "Nombre de tu marca o proyecto",
          categoryLabel: "Categoría del negocio",
          categoryOptions: {
            carwash: "Carwash",
            restaurant: "Restaurante",
            service: "Servicio",
            shop: "Tienda",
            tourism: "Turismo",
            workshop: "Taller",
            other: "Otro",
          },
          contactBlockTitle: "Datos de tu cuenta",
          contactMethodLabel: "Canal preferido de contacto",
          contactMethodOptions: {
            email: "Correo",
            whatsapp: "WhatsApp",
            call: "Llamada",
          },
          descriptionLabel: "¿Qué quieres anunciar?",
          descriptionPlaceholder:
            "Cuéntanos qué ofreces, a quién quieres llegar y dónde te gustaría aparecer.",
          goalLabel: "Objetivo de la campaña",
          goalOptions: {
            awareness: "Más visibilidad",
            leads: "Más consultas",
            reservations: "Más reservas",
            sales: "Más ventas",
            traffic: "Más visitas",
            other: "Otro",
          },
          headline: "Anúnciate en Parking SV",
          intro:
            "Envía una solicitud sencilla con tu cuenta y los detalles de tu negocio. La revisamos y te respondemos en una semana.",
          introBullets: ["Acceso protegido", "Formulario simple", "Respuesta en 7 días"],
          loginHint: "Ya estás dentro con tu cuenta de Parking SV.",
          note:
            "Al enviar este formulario aceptas los términos y nos autorizas a contactarte sobre tu solicitud.",
          pageTitle: "Anúnciate aquí",
          phoneLabel: "Teléfono",
          sendLabel: "Enviar solicitud",
          sendingLabel: "Enviando...",
          socialLabel: "Sitio web o red social",
          socialPlaceholder: "https://instagram.com/tu-marca",
          successTitle: "Solicitud enviada",
          termsLabel:
            "Acepto los términos y condiciones y acepto recibir una respuesta dentro de 7 días.",
        };

  function setField<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  return (
    <>
      <SiteHeader activePage="none" />

      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Parking SV</span>
            <h1>{copy.headline}</h1>
            <p>{copy.intro}</p>

            <ul className={styles.badgeList} aria-label={copy.pageTitle}>
              {copy.introBullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <aside className={styles.contactCard}>
            <span className={styles.contactCardLabel}>{copy.contactBlockTitle}</span>
            <h2>{user.fullName}</h2>
            <dl className={styles.contactList}>
              <div>
                <dt>Email</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt>{copy.phoneLabel}</dt>
                <dd>{user.phoneNumber ?? "No registrado"}</dd>
              </div>
            </dl>
            <p>{copy.loginHint}</p>
            <Link href="/mi-cuenta" className={styles.profileLink}>
              Ver mi cuenta
            </Link>
          </aside>
        </section>

        <section className={styles.formShell}>
          <div className={styles.formCopy}>
            <span className={styles.sectionTag}>{copy.pageTitle}</span>
            <h2>{copy.audience}</h2>
            <p>{copy.audienceDesc}</p>
          </div>

          {state.errorMessage ? (
            <div className={styles.messageError} role="alert">
              {state.errorMessage}
            </div>
          ) : null}

          {state.successMessage ? (
            <div className={styles.messageSuccess} role="status">
              <strong>{copy.successTitle}.</strong> {state.successMessage}
            </div>
          ) : null}

          <form action={formAction} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="business_name">{copy.businessLabel}</label>
              <input
                id="business_name"
                name="business_name"
                type="text"
                value={values.business_name}
                onChange={(event) => setField("business_name", event.target.value)}
                placeholder={copy.businessPlaceholder}
              />
              {state.fieldErrors.businessName ? (
                <p className={styles.fieldError}>{state.fieldErrors.businessName}</p>
              ) : null}
            </div>

            <div className={styles.gridTwo}>
              <div className={styles.field}>
                <label htmlFor="business_category">{copy.categoryLabel}</label>
                <select
                  id="business_category"
                  name="business_category"
                  value={values.business_category}
                  onChange={(event) => setField("business_category", event.target.value)}
                >
                  <option value="">{preferences.language === "en" ? "Choose an option" : "Selecciona una opción"}</option>
                  <option value="carwash">{copy.categoryOptions.carwash}</option>
                  <option value="restaurant">{copy.categoryOptions.restaurant}</option>
                  <option value="workshop">{copy.categoryOptions.workshop}</option>
                  <option value="shop">{copy.categoryOptions.shop}</option>
                  <option value="tourism">{copy.categoryOptions.tourism}</option>
                  <option value="service">{copy.categoryOptions.service}</option>
                  <option value="other">{copy.categoryOptions.other}</option>
                </select>
                {state.fieldErrors.category ? (
                  <p className={styles.fieldError}>{state.fieldErrors.category}</p>
                ) : null}
              </div>

              <div className={styles.field}>
                <label htmlFor="campaign_goal">{copy.goalLabel}</label>
                <select
                  id="campaign_goal"
                  name="campaign_goal"
                  value={values.campaign_goal}
                  onChange={(event) => setField("campaign_goal", event.target.value)}
                >
                  <option value="">{preferences.language === "en" ? "Choose an option" : "Selecciona una opción"}</option>
                  <option value="awareness">{copy.goalOptions.awareness}</option>
                  <option value="leads">{copy.goalOptions.leads}</option>
                  <option value="reservations">{copy.goalOptions.reservations}</option>
                  <option value="sales">{copy.goalOptions.sales}</option>
                  <option value="traffic">{copy.goalOptions.traffic}</option>
                  <option value="other">{copy.goalOptions.other}</option>
                </select>
                {state.fieldErrors.campaignGoal ? (
                  <p className={styles.fieldError}>{state.fieldErrors.campaignGoal}</p>
                ) : null}
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="description">{copy.descriptionLabel}</label>
              <textarea
                id="description"
                name="description"
                rows={5}
                value={values.description}
                onChange={(event) => setField("description", event.target.value)}
                placeholder={copy.descriptionPlaceholder}
              />
              {state.fieldErrors.description ? (
                <p className={styles.fieldError}>{state.fieldErrors.description}</p>
              ) : null}
            </div>

            <div className={styles.gridTwo}>
              <div className={styles.field}>
                <label htmlFor="budget_range">{copy.budgetLabel}</label>
                <select
                  id="budget_range"
                  name="budget_range"
                  value={values.budget_range}
                  onChange={(event) => setField("budget_range", event.target.value)}
                >
                  <option value="sin_definir">{copy.budgetOptions.flexible}</option>
                  <option value="menos_100">{copy.budgetOptions.low}</option>
                  <option value="100_250">{copy.budgetOptions.mid}</option>
                  <option value="250_500">{copy.budgetOptions.high}</option>
                  <option value="500_plus">{copy.budgetOptions.premium}</option>
                </select>
                {state.fieldErrors.budgetRange ? (
                  <p className={styles.fieldError}>{state.fieldErrors.budgetRange}</p>
                ) : null}
              </div>

              <div className={styles.field}>
                <label htmlFor="preferred_contact">{copy.contactMethodLabel}</label>
                <select
                  id="preferred_contact"
                  name="preferred_contact"
                  value={values.preferred_contact}
                  onChange={(event) => setField("preferred_contact", event.target.value)}
                >
                  <option value="email">{copy.contactMethodOptions.email}</option>
                  <option value="whatsapp">{copy.contactMethodOptions.whatsapp}</option>
                  <option value="call">{copy.contactMethodOptions.call}</option>
                </select>
                {state.fieldErrors.preferredContact ? (
                  <p className={styles.fieldError}>{state.fieldErrors.preferredContact}</p>
                ) : null}
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="website_or_social">{copy.socialLabel}</label>
              <input
                id="website_or_social"
                name="website_or_social"
                type="text"
                value={values.website_or_social}
                onChange={(event) => setField("website_or_social", event.target.value)}
                placeholder={copy.socialPlaceholder}
              />
              {state.fieldErrors.websiteOrSocial ? (
                <p className={styles.fieldError}>{state.fieldErrors.websiteOrSocial}</p>
              ) : null}
            </div>

            <div className={styles.termsRow}>
              <label className={styles.checkboxLabel} htmlFor="terms_accepted">
                <input
                  id="terms_accepted"
                  name="terms_accepted"
                  type="checkbox"
                  checked={values.terms_accepted}
                  onChange={(event) => setField("terms_accepted", event.target.checked)}
                />
                <span>{copy.termsLabel}</span>
              </label>
              {state.fieldErrors.termsAccepted ? (
                <p className={styles.fieldError}>{state.fieldErrors.termsAccepted}</p>
              ) : null}
            </div>

            <p className={styles.note}>{copy.note}</p>

            <SubmitButton label={copy.sendLabel} pendingLabel={copy.sendingLabel} />
          </form>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
