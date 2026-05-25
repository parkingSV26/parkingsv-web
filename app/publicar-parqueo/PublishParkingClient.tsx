/* eslint-disable @next/next/no-img-element */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { getParkingBySlug } from "@/app/parqueos/parking-data";
import { publishParkingAction } from "./actions";
import {
  initialPublishParkingState,
  STATIC_PUBLISHED_PARKING_ID,
} from "./publish-parking-state";
import styles from "./publicar-parqueo.module.css";

type PublishParkingClientProps = {
  ownerName: string;
};

type ModalKey = "category" | "location" | "rates" | "schedule" | null;
type CategoryId = "alta-demanda" | "mixto" | "normal" | "premium" | "turistico";
type DayId =
  | "lunes"
  | "martes"
  | "miercoles"
  | "jueves"
  | "viernes"
  | "sabado"
  | "domingo";

type RateDraft = {
  appliesTo: string;
  feeType: string;
  price: string;
  timeUnit: string;
  vehicleType: string;
};

type RateItem = RateDraft & {
  id: string;
};

type ScheduleDayState = {
  close: string;
  enabled: boolean;
  open: string;
};

type LocationState = {
  address: string;
  department: string;
  googleMapsLink: string;
  municipality: string;
  reference: string;
  wazeLink: string;
};

type ImagePreview = {
  name: string;
  url: string;
};

const categoryOptions = [
  {
    description: "Ideal para visitas cotidianas con flujo constante y acceso simple.",
    icon: "fa-solid fa-car",
    id: "normal",
    label: "Normal",
  },
  {
    description: "Pensado para centros comerciales y zonas con mucha rotacion.",
    icon: "fa-solid fa-car-side",
    id: "alta-demanda",
    label: "Alta demanda",
  },
  {
    description: "Perfecto para zonas de paseo, eventos o recorridos urbanos.",
    icon: "fa-solid fa-map-location-dot",
    id: "turistico",
    label: "Turistico",
  },
  {
    description: "Combina espacios para distintos tipos de uso y diferentes vehiculos.",
    icon: "fa-solid fa-table-cells-large",
    id: "mixto",
    label: "Mixto",
  },
  {
    description: "Una experiencia mas cuidada, segura y con extras destacados.",
    icon: "fa-solid fa-crown",
    id: "premium",
    label: "Premium",
  },
] as const satisfies ReadonlyArray<{
  description: string;
  icon: string;
  id: CategoryId;
  label: string;
}>;

const departmentOptions: Record<string, string[]> = {
  "San Salvador Centro": ["San Salvador Centro"],
  "San Salvador Norte": ["Aguilares", "Apopa", "Ilopango", "Soyapango"],
  "San Salvador Oeste": ["Antiguo Cuscatlan", "Santa Tecla", "Zaragoza"],
  "San Salvador Sur": ["Panchimalco", "Rosario de Mora", "San Marcos"],
};

const scheduleDayLabels: Array<{ id: DayId; label: string }> = [
  { id: "lunes", label: "Lunes" },
  { id: "martes", label: "Martes" },
  { id: "miercoles", label: "Miercoles" },
  { id: "jueves", label: "Jueves" },
  { id: "viernes", label: "Viernes" },
  { id: "sabado", label: "Sabado" },
  { id: "domingo", label: "Domingo" },
];

const serviceOptions = [
  { icon: "fa-solid fa-video", label: "Camaras" },
  { icon: "fa-solid fa-shield-halved", label: "Vigilancia" },
  { icon: "fa-solid fa-bolt", label: "Carga electrica" },
  { icon: "fa-solid fa-wifi", label: "Wi-Fi" },
  { icon: "fa-solid fa-soap", label: "Carwash" },
  { icon: "fa-solid fa-utensils", label: "Comedor" },
  { icon: "fa-solid fa-wheelchair", label: "Accesibilidad" },
  { icon: "fa-solid fa-restroom", label: "Sanitarios" },
];

const restrictionOptions = [
  { icon: "fa-solid fa-ban", label: "No fumar" },
  { icon: "fa-solid fa-volume-xmark", label: "Sin musica alta" },
  { icon: "fa-solid fa-person-running", label: "Sin carreras" },
  { icon: "fa-solid fa-store-slash", label: "Sin ventas ambulantes" },
  { icon: "fa-solid fa-car-burst", label: "Sin maniobras riesgosas" },
  { icon: "fa-solid fa-horn", label: "Sin bocinas" },
];

const parkingPreview = (() => {
  const parking = getParkingBySlug(STATIC_PUBLISHED_PARKING_ID);

  if (!parking) {
    throw new Error("No se encontro el parqueo seleccionado para publicar.");
  }

  return parking;
})();

function PublishParkingSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={styles.submitButton} disabled={pending}>
      <i className={`fa-solid ${pending ? "fa-spinner fa-spin" : "fa-paper-plane"}`} aria-hidden="true" />
      <span>{pending ? "Publicando..." : "Publicar parqueo"}</span>
    </button>
  );
}

export default function PublishParkingClient({ ownerName }: PublishParkingClientProps) {
  const [state, formAction] = useActionState(publishParkingAction, initialPublishParkingState);
  const [activeModal, setActiveModal] = useState<ModalKey>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("mixto");
  const [location, setLocation] = useState<LocationState>({
    address: "Avenida Albert Einstein, local 5",
    department: "San Salvador Centro",
    googleMapsLink: "",
    municipality: "San Salvador Centro",
    reference: "A la par de la plaza y cerca de comercios",
    wazeLink: "",
  });
  const [is24_7, setIs24_7] = useState(false);
  const [schedule, setSchedule] = useState<Record<DayId, ScheduleDayState>>({
    lunes: { enabled: true, open: "06:00", close: "20:00" },
    martes: { enabled: true, open: "06:00", close: "20:00" },
    miercoles: { enabled: true, open: "06:00", close: "20:00" },
    jueves: { enabled: true, open: "06:00", close: "20:00" },
    viernes: { enabled: true, open: "06:00", close: "21:00" },
    sabado: { enabled: true, open: "07:00", close: "21:00" },
    domingo: { enabled: false, open: "08:00", close: "17:00" },
  });
  const [selectedServices, setSelectedServices] = useState<string[]>([
    "Camaras",
    "Vigilancia",
    "Carga electrica",
  ]);
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>([
    "No fumar",
    "Sin maniobras riesgosas",
  ]);
  const [rateDraft, setRateDraft] = useState<RateDraft>({
    appliesTo: "Toda la semana",
    feeType: "normal",
    price: "1.00",
    timeUnit: "hora",
    vehicleType: "Auto",
  });
  const [rates, setRates] = useState<RateItem[]>([
    {
      appliesTo: "Toda la semana",
      feeType: "normal",
      id: "rate-1",
      price: "1.00",
      timeUnit: "hora",
      vehicleType: "Auto",
    },
  ]);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((image) => URL.revokeObjectURL(image.url));
    };
  }, [imagePreviews]);

  const departmentMunicipalities = departmentOptions[location.department] ?? [];
  const selectedCategoryData =
    categoryOptions.find((category) => category.id === selectedCategory) ?? categoryOptions[0];
  const enabledDays = scheduleDayLabels.filter((day) => schedule[day.id].enabled);
  const scheduleSummary = is24_7
    ? "Abierto 24/7"
    : enabledDays.length === 0
      ? "Sin dias seleccionados"
      : `${enabledDays.length} dia(s) activos`;

  function toggleService(label: string) {
    setSelectedServices((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label],
    );
  }

  function toggleRestriction(label: string) {
    setSelectedRestrictions((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label],
    );
  }

  function addRate() {
    setRates((current) => [
      ...current,
      {
        ...rateDraft,
        id: `rate-${current.length + 1}`,
      },
    ]);
    setActiveModal(null);
  }

  function removeRate(rateId: string) {
    setRates((current) => current.filter((rate) => rate.id !== rateId));
  }

  function handleDepartmentChange(nextDepartment: string) {
    const municipalities = departmentOptions[nextDepartment] ?? [];

    setLocation((current) => ({
      ...current,
      department: nextDepartment,
      municipality: municipalities[0] ?? "",
    }));
  }

  function updateSchedule(day: DayId, field: keyof ScheduleDayState, value: boolean | string) {
    setSchedule((current) => ({
      ...current,
      [day]: {
        ...current[day],
        [field]: value,
      },
    }));
  }

  function handleImagesSelected(files: FileList | null) {
    setImagePreviews((current) => {
      current.forEach((image) => URL.revokeObjectURL(image.url));

      if (!files || files.length === 0) {
        return [];
      }

      return Array.from(files)
        .slice(0, 8)
        .map((file) => ({
          name: file.name,
          url: URL.createObjectURL(file),
        }));
    });
  }

  return (
    <section className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Panel de propietario</p>
            <h1>
              Publica tu parqueo, <span>{ownerName}</span>
            </h1>
            <p className={styles.heroText}>
              Completa la informacion principal de tu espacio, organiza su disponibilidad y revisa
              la publicacion antes de enviarla.
            </p>
          </div>

          <div className={styles.heroCard}>
            <p>Publicacion destacada</p>
            <strong>{parkingPreview.name}</strong>
            <span>
              {parkingPreview.department}, {parkingPreview.municipality}
            </span>
          </div>
        </header>

        {state.errorMessage ? (
          <div className={`${styles.alert} ${styles.alertError}`}>
            <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
            <span>{state.errorMessage}</span>
          </div>
        ) : null}

        {state.successMessage ? (
          <div className={`${styles.alert} ${styles.alertSuccess}`}>
            <i className="fa-solid fa-circle-check" aria-hidden="true" />
            <span>{state.successMessage}</span>
          </div>
        ) : null}

        <form action={formAction} className={styles.form}>
          <section className={`${styles.section} ${styles.sectionWarm}`}>
            <div className={styles.sectionHeader}>
              <h2>
                <i className="fa-solid fa-square-parking" aria-hidden="true" />
                Informacion basica
              </h2>
              <span className={styles.sectionHint}>Completa los datos principales del parqueo</span>
            </div>

            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span>Nombre del parqueo</span>
                <div className={styles.inputWithIcon}>
                  <i className="fa-solid fa-sign-hanging" aria-hidden="true" />
                  <input name="nombre" type="text" placeholder="Nombre del parqueo" defaultValue="Parqueo Central" />
                </div>
              </label>

              <label className={styles.field}>
                <span>Nombre del negocio</span>
                <div className={styles.inputWithIcon}>
                  <i className="fa-solid fa-store" aria-hidden="true" />
                  <input
                    name="business_name"
                    type="text"
                    placeholder="Nombre del negocio"
                    defaultValue="Parking SV Central"
                  />
                </div>
              </label>
            </div>

            <div className={styles.actionRow}>
              <button type="button" className={styles.actionButton} onClick={() => setActiveModal("category")}>
                <i className="fa-solid fa-tags" aria-hidden="true" />
                <span>Categoria</span>
              </button>
              <button type="button" className={styles.actionButton} onClick={() => setActiveModal("location")}>
                <i className="fa-solid fa-location-dot" aria-hidden="true" />
                <span>Ubicacion</span>
              </button>
              <button type="button" className={styles.actionButton} onClick={() => setActiveModal("schedule")}>
                <i className="fa-solid fa-clock" aria-hidden="true" />
                <span>Horario</span>
              </button>
              <button type="button" className={styles.actionButton} onClick={() => setActiveModal("rates")}>
                <i className="fa-solid fa-dollar-sign" aria-hidden="true" />
                <span>Tarifas</span>
              </button>
            </div>

            <div className={styles.summaryGrid}>
              <article className={styles.summaryCard}>
                <strong>Categoria</strong>
                <p>{selectedCategoryData.label}</p>
              </article>
              <article className={styles.summaryCard}>
                <strong>Ubicacion</strong>
                <p>{formatParkingLocation(location.department, location.municipality)}</p>
              </article>
              <article className={styles.summaryCard}>
                <strong>Horario</strong>
                <p>{scheduleSummary}</p>
              </article>
              <article className={styles.summaryCard}>
                <strong>Tarifas</strong>
                <p>{rates.length} configurada(s)</p>
              </article>
            </div>
          </section>

          <section className={`${styles.section} ${styles.sectionCool}`}>
            <div className={styles.sectionHeader}>
              <h2>
                <i className="fa-solid fa-images" aria-hidden="true" />
                Imagenes del parqueo
              </h2>
            </div>

            <label className={styles.uploadArea}>
              <input
                name="imagenes"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={(event) => handleImagesSelected(event.target.files)}
              />
              <div>
                <i className="fa-solid fa-cloud-arrow-up" aria-hidden="true" />
                <strong>Sube hasta 8 imagenes</strong>
                <span>Sube imagenes para enriquecer la presentacion visual de tu parqueo.</span>
              </div>
            </label>

            <div className={styles.previewGrid}>
              {imagePreviews.length > 0
                ? imagePreviews.map((image) => (
                    <div key={image.url} className={styles.previewCard}>
                      <img src={image.url} alt={image.name} />
                      <span>{image.name}</span>
                    </div>
                  ))
                : parkingPreview.images.slice(0, 4).map((image, index) => (
                    <div key={image} className={styles.previewCard}>
                      <img src={image} alt={`Referencia visual ${index + 1}`} />
                      <span>Referencia visual {index + 1}</span>
                    </div>
                  ))}
            </div>
          </section>

          <section className={`${styles.section} ${styles.sectionGreen}`}>
            <div className={styles.sectionHeader}>
              <h2>
                <i className="fa-solid fa-warehouse" aria-hidden="true" />
                Capacidad y contacto
              </h2>
            </div>

            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span>Capacidad general</span>
                <div className={styles.inputWithIcon}>
                  <i className="fa-solid fa-car-side" aria-hidden="true" />
                  <input name="capacidad_general" type="number" min="0" defaultValue="120" />
                </div>
              </label>

              <label className={styles.field}>
                <span>Espacios reservables</span>
                <div className={styles.inputWithIcon}>
                  <i className="fa-solid fa-calendar-check" aria-hidden="true" />
                  <input name="reservable_capacity" type="number" min="0" defaultValue="24" />
                </div>
              </label>

              <label className={styles.field}>
                <span>Telefono de contacto</span>
                <div className={styles.inputWithIcon}>
                  <i className="fa-solid fa-phone" aria-hidden="true" />
                  <input name="contacto_telefono" type="tel" defaultValue="7000-2211" />
                </div>
              </label>

              <label className={styles.field}>
                <span>Correo de contacto</span>
                <div className={styles.inputWithIcon}>
                  <i className="fa-solid fa-envelope" aria-hidden="true" />
                  <input name="contacto_email" type="email" defaultValue="propietario@parkingsv.com" />
                </div>
              </label>
            </div>
          </section>

          <section className={`${styles.section} ${styles.sectionGreenSoft}`}>
            <div className={styles.sectionHeader}>
              <h2>
                <i className="fa-solid fa-bell-concierge" aria-hidden="true" />
                Servicios
              </h2>
              <span className={styles.sectionHint}>Toca para seleccionar</span>
            </div>

            <div className={styles.optionGrid}>
              {serviceOptions.map((service) => {
                const active = selectedServices.includes(service.label);

                return (
                  <button
                    key={service.label}
                    type="button"
                    className={`${styles.optionCard} ${active ? styles.optionCardActive : ""}`}
                    onClick={() => toggleService(service.label)}
                  >
                    <i className={service.icon} aria-hidden="true" />
                    <span>{service.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className={`${styles.section} ${styles.sectionWarning}`}>
            <div className={styles.sectionHeader}>
              <h2>
                <i className="fa-solid fa-align-left" aria-hidden="true" />
                Descripcion
              </h2>
            </div>

            <textarea
              name="descripcion"
              className={styles.textarea}
              placeholder="Describe tu parqueo..."
              defaultValue="Parqueo comodo, seguro y bien ubicado para estadias cortas o jornadas completas, con acceso agil, vigilancia y espacios pensados para visitas diarias."
            />
          </section>

          <section className={`${styles.section} ${styles.sectionDanger}`}>
            <div className={styles.sectionHeader}>
              <h2>
                <i className="fa-solid fa-ban" aria-hidden="true" />
                Restricciones
              </h2>
            </div>

            <div className={styles.optionGrid}>
              {restrictionOptions.map((restriction) => {
                const active = selectedRestrictions.includes(restriction.label);

                return (
                  <button
                    key={restriction.label}
                    type="button"
                    className={`${styles.optionCard} ${active ? styles.optionCardDangerActive : ""}`}
                    onClick={() => toggleRestriction(restriction.label)}
                  >
                    <i className={restriction.icon} aria-hidden="true" />
                    <span>{restriction.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className={`${styles.section} ${styles.sectionPeach}`}>
            <div className={styles.sectionHeader}>
              <h2>
                <i className="fa-solid fa-ruler-combined" aria-hidden="true" />
                Restricciones fisicas
              </h2>
            </div>

            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span>Altura maxima permitida</span>
                <div className={styles.inputWithIcon}>
                  <i className="fa-solid fa-arrow-up-wide-short" aria-hidden="true" />
                  <input name="altura_maxima" type="text" defaultValue="2.40 m" />
                </div>
              </label>
              <label className={styles.field}>
                <span>Velocidad maxima</span>
                <div className={styles.inputWithIcon}>
                  <i className="fa-solid fa-gauge-high" aria-hidden="true" />
                  <input name="velocidad_maxima" type="text" defaultValue="10 km/h" />
                </div>
              </label>
            </div>
          </section>

          <section className={`${styles.section} ${styles.sectionPreview}`}>
            <div className={styles.sectionHeader}>
              <h2>
                <i className="fa-solid fa-eye" aria-hidden="true" />
                Vista previa de la publicacion
              </h2>
            </div>

            <div className={styles.demoCard}>
              <div className={styles.demoCardMedia}>
                <Image
                  src={parkingPreview.image}
                  alt={parkingPreview.name}
                  fill
                  sizes="(max-width: 760px) 100vw, 420px"
                />
              </div>
              <div className={styles.demoCardBody}>
                <span className={styles.demoBadge}>Vista destacada</span>
                <h3>{parkingPreview.name}</h3>
                <p>
                  {parkingPreview.department}, {parkingPreview.municipality}
                </p>
                <p>{parkingPreview.description}</p>
                <div className={styles.demoMeta}>
                  <span>
                    <i className="fa-solid fa-dollar-sign" aria-hidden="true" /> {parkingPreview.mainPrice}
                  </span>
                  <span>
                    <i className="fa-solid fa-star" aria-hidden="true" />{" "}
                    {parkingPreview.rating?.toFixed(1) ?? "Nuevo"}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.submitSection}>
            <label className={styles.termsRow}>
              <input type="checkbox" name="accept_terms" />
              <span>
                Acepto los terminos y confirmo la informacion ingresada en esta publicacion.
              </span>
            </label>

            <input type="hidden" name="categoria_id" value={selectedCategory} />
            <input type="hidden" name="departamento" value={location.department} />
            <input type="hidden" name="municipio" value={location.municipality} />
            <input type="hidden" name="direccion" value={location.address} />
            <input type="hidden" name="referencia" value={location.reference} />
            <input type="hidden" name="waze_link" value={location.wazeLink} />
            <input type="hidden" name="google_maps_link" value={location.googleMapsLink} />
            <input type="hidden" name="is_24_7" value={is24_7 ? "1" : "0"} />
            <input type="hidden" name="servicios" value={selectedServices.join(", ")} />
            <input type="hidden" name="restricciones" value={selectedRestrictions.join(", ")} />
            <input type="hidden" name="parking_revision" value={String(state.revision)} />

            {rates.map((rate) => (
              <input
                key={rate.id}
                type="hidden"
                name="tarifa_resumen"
                value={`${rate.vehicleType}|${rate.price}|${rate.timeUnit}|${rate.appliesTo}`}
              />
            ))}

            <PublishParkingSubmitButton />
          </section>
        </form>

        {state.publishedParkingId ? (
          <section className={styles.resultSection}>
            <div className={styles.resultCard}>
              <div>
                <p className={styles.eyebrow}>Publicacion lista</p>
                <h2>{parkingPreview.name}</h2>
                <p>
                  La accion del formulario ya respondio y el detalle publicado esta listo para
                  revisarse dentro de la plataforma.
                </p>
              </div>

              <div className={styles.resultActions}>
                <Link href={`/parqueos/${state.publishedParkingId}`} className={styles.primaryLink}>
                  Ver detalle publicado
                </Link>
                <Link href="/mis-parqueos" className={styles.secondaryLink}>
                  Volver a mis parqueos
                </Link>
              </div>
            </div>
          </section>
        ) : null}
      </div>

      {activeModal ? (
        <div className={styles.modalBackdrop} onClick={() => setActiveModal(null)}>
          <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.modalEyebrow}>Configuracion rapida</p>
                <h3>{resolveModalTitle(activeModal)}</h3>
              </div>
              <button type="button" className={styles.modalClose} onClick={() => setActiveModal(null)}>
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>

            <div className={styles.modalBody}>
              {activeModal === "category" ? (
                <div className={styles.modalGrid}>
                  {categoryOptions.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      className={`${styles.modalOption} ${
                        selectedCategory === category.id ? styles.modalOptionSelected : ""
                      }`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <i className={category.icon} aria-hidden="true" />
                      <strong>{category.label}</strong>
                      <span>{category.description}</span>
                    </button>
                  ))}
                </div>
              ) : null}

              {activeModal === "location" ? (
                <div className={styles.modalFields}>
                  <label className={styles.field}>
                    <span>Departamento</span>
                    <select value={location.department} onChange={(event) => handleDepartmentChange(event.target.value)}>
                      {Object.keys(departmentOptions).map((department) => (
                        <option key={department} value={department}>
                          {department}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={styles.field}>
                    <span>Municipio</span>
                    <select
                      value={location.municipality}
                      onChange={(event) =>
                        setLocation((current) => ({
                          ...current,
                          municipality: event.target.value,
                        }))
                      }
                    >
                      {departmentMunicipalities.map((municipality) => (
                        <option key={municipality} value={municipality}>
                          {municipality}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={styles.field}>
                    <span>Direccion</span>
                    <input
                      value={location.address}
                      onChange={(event) =>
                        setLocation((current) => ({
                          ...current,
                          address: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Referencia</span>
                    <input
                      value={location.reference}
                      onChange={(event) =>
                        setLocation((current) => ({
                          ...current,
                          reference: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Link de Waze</span>
                    <input
                      placeholder="https://waze.com/..."
                      value={location.wazeLink}
                      onChange={(event) =>
                        setLocation((current) => ({
                          ...current,
                          wazeLink: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Link de Google Maps</span>
                    <input
                      placeholder="https://maps.google.com/..."
                      value={location.googleMapsLink}
                      onChange={(event) =>
                        setLocation((current) => ({
                          ...current,
                          googleMapsLink: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
              ) : null}

              {activeModal === "schedule" ? (
                <div className={styles.modalFields}>
                  <label className={styles.toggleRow}>
                    <input type="checkbox" checked={is24_7} onChange={(event) => setIs24_7(event.target.checked)} />
                    <span>Abierto 24/7</span>
                  </label>

                  {!is24_7 ? (
                    <div className={styles.scheduleList}>
                      {scheduleDayLabels.map((day) => (
                        <div key={day.id} className={styles.scheduleCard}>
                          <label className={styles.scheduleDay}>
                            <input
                              type="checkbox"
                              checked={schedule[day.id].enabled}
                              onChange={(event) => updateSchedule(day.id, "enabled", event.target.checked)}
                            />
                            <span>{day.label}</span>
                          </label>

                          <div className={styles.scheduleInputs}>
                            <input
                              type="time"
                              value={schedule[day.id].open}
                              disabled={!schedule[day.id].enabled}
                              onChange={(event) => updateSchedule(day.id, "open", event.target.value)}
                            />
                            <input
                              type="time"
                              value={schedule[day.id].close}
                              disabled={!schedule[day.id].enabled}
                              onChange={(event) => updateSchedule(day.id, "close", event.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {activeModal === "rates" ? (
                <div className={styles.modalFields}>
                  <label className={styles.field}>
                    <span>Tipo de vehiculo</span>
                    <select
                      value={rateDraft.vehicleType}
                      onChange={(event) =>
                        setRateDraft((current) => ({
                          ...current,
                          vehicleType: event.target.value,
                        }))
                      }
                    >
                      <option value="Auto">Auto</option>
                      <option value="Motocicleta">Motocicleta</option>
                      <option value="Pickup">Pickup</option>
                      <option value="Microbus">Microbus</option>
                      <option value="Bicicleta">Bicicleta</option>
                    </select>
                  </label>

                  <label className={styles.field}>
                    <span>Tipo de tarifa</span>
                    <select
                      value={rateDraft.feeType}
                      onChange={(event) =>
                        setRateDraft((current) => ({
                          ...current,
                          feeType: event.target.value,
                        }))
                      }
                    >
                      <option value="normal">Normal</option>
                      <option value="premium">Premium</option>
                      <option value="nocturno">Nocturno</option>
                      <option value="evento">Evento</option>
                    </select>
                  </label>

                  <label className={styles.field}>
                    <span>Precio</span>
                    <input
                      value={rateDraft.price}
                      onChange={(event) =>
                        setRateDraft((current) => ({
                          ...current,
                          price: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Unidad de tiempo</span>
                    <select
                      value={rateDraft.timeUnit}
                      onChange={(event) =>
                        setRateDraft((current) => ({
                          ...current,
                          timeUnit: event.target.value,
                        }))
                      }
                    >
                      <option value="minuto">Minuto</option>
                      <option value="hora">Hora</option>
                      <option value="dia">Dia</option>
                      <option value="mes">Mes</option>
                    </select>
                  </label>

                  <label className={styles.field}>
                    <span>Aplica a</span>
                    <select
                      value={rateDraft.appliesTo}
                      onChange={(event) =>
                        setRateDraft((current) => ({
                          ...current,
                          appliesTo: event.target.value,
                        }))
                      }
                    >
                      <option value="Toda la semana">Toda la semana</option>
                      <option value="Dias laborales">Dias laborales</option>
                      <option value="Fines de semana">Fines de semana</option>
                    </select>
                  </label>

                  <button type="button" className={styles.modalPrimaryButton} onClick={addRate}>
                    Guardar tarifa
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <section className={styles.floatingRates}>
        <div className={styles.floatingRatesCard}>
          <div className={styles.sectionHeader}>
            <h2>
              <i className="fa-solid fa-receipt" aria-hidden="true" />
              Tarifas agregadas
            </h2>
          </div>

          <div className={styles.rateList}>
            {rates.map((rate) => (
              <article key={rate.id} className={styles.rateItem}>
                <div>
                  <strong>{rate.vehicleType}</strong>
                  <p>
                    ${rate.price} por {rate.timeUnit}
                  </p>
                  <span>
                    {rate.feeType} · {rate.appliesTo}
                  </span>
                </div>
                <button type="button" className={styles.rateRemove} onClick={() => removeRate(rate.id)}>
                  <i className="fa-solid fa-xmark" aria-hidden="true" />
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}

function resolveModalTitle(modal: Exclude<ModalKey, null>) {
  switch (modal) {
    case "category":
      return "Selecciona una categoria";
    case "location":
      return "Configura la ubicacion";
    case "schedule":
      return "Define el horario";
    case "rates":
      return "Agrega una tarifa";
    default:
      return "";
  }
}

function formatParkingLocation(department: string, municipality: string) {
  return normalizeText(department) === normalizeText(municipality)
    ? department
    : `${department}, ${municipality}`;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
