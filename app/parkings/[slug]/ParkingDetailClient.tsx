/* eslint-disable @next/next/no-img-element */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Parking, ParkingDayKey, ParkingReview } from "@/app/parkings/parking-data";
import styles from "./parking-detail.module.css";

type ActiveModal = "capacity" | "google" | "location" | "reserve" | "schedule" | "share" | "waze" | null;

type NotificationState = {
  message: string;
  type: "error" | "success";
} | null;

type ReservationDraft = {
  endAt: string;
  startAt: string;
  vehicleTypeId: number;
};

type ReservationResponse = {
  code: string;
  endAt: string;
  id: number;
  parkingId: number;
  startAt: string;
  status: string;
  vehicleTypeId: number;
};

type ParkingDetailClientProps = {
  parking: Parking;
  sessionUser: {
    email: string;
    fullName: string;
    id: number;
    profilePicture: string;
    userType: "customer" | "owner";
  } | null;
};

const iconAliases: Record<string, string> = {
  "car-alt": "car-rear",
  "truck-pickup": "truck",
};

function createReservationDraft(parking: Parking): ReservationDraft {
  const now = new Date();
  const startAt = new Date(now.getTime() + 60 * 60 * 1000);
  const endAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  return {
    endAt: formatDateTimeLocal(endAt),
    startAt: formatDateTimeLocal(startAt),
    vehicleTypeId: parking.vehicleCapacities[0]?.id ?? 0,
  };
}

function formatDateTimeLocal(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export default function ParkingDetailClient({
  parking,
  sessionUser,
}: ParkingDetailClientProps) {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const [notification, setNotification] = useState<NotificationState>(null);
  const [reviews, setReviews] = useState(parking.reviews);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);
  const [reservationDraft, setReservationDraft] = useState<ReservationDraft>(() =>
    createReservationDraft(parking),
  );
  const [isReserving, setIsReserving] = useState(false);

  const averageRating = reviews.length
    ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
    : parking.rating;
  const totalImages = parking.images.length;
  const hasMultipleImages = totalImages > 1;
  const previewImages = parking.images.slice(0, Math.min(5, parking.images.length));
  const galleryClassName = resolveGalleryLayoutClass(previewImages.length);

  useEffect(() => {
    document.body.style.overflow = activeModal || fullscreenIndex !== null ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [activeModal, fullscreenIndex]);

  useEffect(() => {
    if (!notification) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setNotification(null);
    }, 2600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [notification]);

  function openModal(modal: ActiveModal) {
    if (modal === "reserve") {
      setReservationDraft(createReservationDraft(parking));
    }

    setActiveModal(modal);
  }

  function closeModal() {
    setActiveModal(null);
  }

  function showNotification(message: string, type: "error" | "success") {
    setNotification({ message, type });
  }

  async function copyText(value: string, label: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const tempInput = document.createElement("input");
        tempInput.value = value;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
      }

      showNotification(`${label} copiado al portapapeles.`, "success");
    } catch (error) {
      console.error(error);
      showNotification(`No se pudo copiar ${label.toLowerCase()}.`, "error");
    }
  }

  function shareOnFacebook() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank", "noopener,noreferrer");
  }

  function shareOnTwitter() {
    const text = encodeURIComponent(`Mira este parqueo: ${parking.name}`);
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function shareOnWhatsApp() {
    const text = encodeURIComponent(`Mira este parqueo: ${parking.name} - ${window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }

  function openFullscreenGallery(index: number) {
    setFullscreenIndex(index);
  }

  function closeFullscreenGallery() {
    setFullscreenIndex(null);
  }

  function moveGallery(direction: "next" | "prev") {
    setFullscreenIndex((current) => {
      if (current === null) {
        return current;
      }

      if (direction === "prev") {
        return (current - 1 + totalImages) % totalImages;
      }

      return (current + 1) % totalImages;
    });
  }

  function handleReserveAction() {
    if (!sessionUser) {
      showNotification("Inicia sesión para reservar un espacio.", "error");
      return;
    }

    if (sessionUser.userType !== "customer") {
      showNotification("Solo las cuentas de cliente pueden reservar espacios.", "error");
      return;
    }

    openModal("reserve");
  }

  async function saveReservation() {
    if (!sessionUser) {
      showNotification("Inicia sesión para reservar un espacio.", "error");
      return;
    }

    if (!reservationDraft.vehicleTypeId) {
      showNotification("Selecciona un tipo de vehículo.", "error");
      return;
    }

    try {
      setIsReserving(true);
      const response = await fetch("/api/reservations", {
        body: JSON.stringify({
          endAt: reservationDraft.endAt,
          parkingId: parking.dbId,
          startAt: reservationDraft.startAt,
          vehicleTypeId: reservationDraft.vehicleTypeId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as {
        error?: string;
        reservation?: ReservationResponse;
      };

      if (!response.ok || !payload.reservation) {
        throw new Error(payload.error ?? "No se pudo crear la reserva.");
      }

      showNotification("Reserva creada correctamente. Revisa Mis reservas para ver el QR.", "success");
      setActiveModal(null);
      router.push("/mis-reservas");
    } catch (error) {
      console.error(error);
      showNotification(
        error instanceof Error ? error.message : "No se pudo crear la reserva.",
        "error",
      );
    } finally {
      setIsReserving(false);
    }
  }

  async function handleReviewSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (reviewRating === 0) {
      showNotification("Selecciona una calificación antes de enviar tu reseña.", "error");
      return;
    }

    if (!reviewComment.trim()) {
      showNotification("Escribe un comentario para completar la reseña.", "error");
      return;
    }

    try {
      const response = await fetch(`/api/parkings/${parking.dbId}/reviews`, {
        body: JSON.stringify({
          comment: reviewComment.trim(),
          rating: reviewRating,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as {
        error?: string;
        review?: ParkingReview;
      };

      if (!response.ok || !payload.review) {
        throw new Error(payload.error ?? "No se pudo guardar la reseña.");
      }

      setReviews((current) => [payload.review!, ...current]);
      setReviewRating(0);
      setReviewComment("");
      setHasSubmittedReview(true);
      showNotification("Resena agregada correctamente.", "success");
    } catch (error) {
      console.error(error);
      showNotification(
        error instanceof Error ? error.message : "No se pudo guardar la reseña.",
        "error",
      );
    }
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (fullscreenIndex !== null) {
          closeFullscreenGallery();
          return;
        }

        if (activeModal) {
          closeModal();
        }
      }

      if (hasMultipleImages && fullscreenIndex !== null && event.key === "ArrowLeft") {
        setFullscreenIndex((current) => {
          if (current === null) {
            return current;
          }

          return (current - 1 + totalImages) % totalImages;
        });
      }

      if (hasMultipleImages && fullscreenIndex !== null && event.key === "ArrowRight") {
        setFullscreenIndex((current) => {
          if (current === null) {
            return current;
          }

          return (current + 1) % totalImages;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeModal, fullscreenIndex, hasMultipleImages, totalImages]);

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <div className={styles.parkingHeader}>
          <div className={styles.headerInfo}>
            <div className={styles.backRow}>
              <Link href="/parqueos" className={styles.backButton}>
                <i className="fa-solid fa-arrow-left" aria-hidden="true" />
                <span>Volver</span>
              </Link>
            </div>

            <div className={styles.parkingInfo}>
              <h1 className={styles.parkingTitle}>{parking.name}</h1>
              <p className={styles.businessName}>@{parking.businessName}</p>

              <div className={styles.ratingCategory}>
                <div className={styles.rating}>
                  {averageRating !== null ? (
                    <>
                      <span className={styles.stars}>
                        {Array.from({ length: 5 }, (_, index) => (
                          <i
                            key={`hero-star-${index}`}
                            className={
                              index < Math.round(averageRating)
                                ? "fa-solid fa-star"
                                : "fa-regular fa-star"
                            }
                            aria-hidden="true"
                          />
                        ))}
                      </span>
                      <span className={styles.ratingValue}>{averageRating.toFixed(1)} / 5</span>
                    </>
                  ) : (
                    <span className={styles.newBadge}>Nuevo</span>
                  )}
                </div>

                <div className={`${styles.category} ${styles.categoryBlue}`}>
                  {formatCategoryLabel(parking.category)}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.actionButtons}>
            <button
              type="button"
              className={`${styles.shareButton} ${styles.shareButtonYellow}`}
              onClick={() => openModal("share")}
            >
              <i className="fa-solid fa-share-nodes" aria-hidden="true" /> Compartir
            </button>
          </div>
        </div>

        <div className={`${styles.imageGallery} ${galleryClassName}`}>
          {previewImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              className={`${styles.galleryItem} ${index === 0 ? styles.featured : ""}`}
              onClick={() => openFullscreenGallery(index)}
            >
              <Image
                src={image}
                alt={`Imagen ${index + 1} de ${parking.name}`}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className={styles.galleryImage}
              />

              {index === 4 && totalImages > 5 ? (
                <span className={styles.extraCount}>+{totalImages - 5}</span>
              ) : null}
            </button>
          ))}
        </div>

        <div className={styles.infoButtons}>
          <button type="button" className={styles.infoButton} onClick={() => openModal("location")}>
            <i className="fa-solid fa-location-dot" aria-hidden="true" /> Ubicación
          </button>
          <button type="button" className={styles.infoButton} onClick={() => openModal("capacity")}>
            <i className="fa-solid fa-car" aria-hidden="true" /> Capacidad
          </button>
          <button type="button" className={styles.infoButton} onClick={() => openModal("google")}>
            <i className="fa-brands fa-google" aria-hidden="true" /> Ver mapas
          </button>
          <button type="button" className={styles.infoButton} onClick={() => openModal("schedule")}>
            <i className="fa-regular fa-clock" aria-hidden="true" /> Horario
          </button>
        </div>

        <div className={styles.reservationSection}>
          <h3>
            <i className="fa-solid fa-calendar-check" aria-hidden="true" /> Reservar Espacio
          </h3>

          {sessionUser ? (
            parking.reservableSpaces > 0 ? (
              <button type="button" className={styles.reserveButton} onClick={handleReserveAction}>
                <i className="fa-solid fa-calendar-plus" aria-hidden="true" /> Reservar Ahora
              </button>
            ) : (
              <div className={styles.noReservationMessage}>
                <i className="fa-solid fa-circle-info" aria-hidden="true" />
                <p>Este parqueo no ofrece reservas en este momento</p>
              </div>
            )
          ) : (
            <div className={styles.loginRequiredMessage}>
              <i className="fa-solid fa-user-lock" aria-hidden="true" />
              <p>Inicia sesión para reservar un espacio</p>
            </div>
          )}
        </div>

        <div className={`${styles.sectionCard} ${styles.sectionContact}`}>
          <h3>
            <i className="fa-solid fa-address-card" aria-hidden="true" /> Contacto del Parqueo
          </h3>
          <div className={styles.contactInfo}>
            <p>
              <i className="fa-solid fa-user" aria-hidden="true" />
              <strong>Contacto:</strong> {parking.contact.name}
            </p>
            <p>
              <i className="fa-solid fa-phone" aria-hidden="true" />
              <strong>Teléfono:</strong> {parking.contact.phone}
            </p>
            <p>
              <i className="fa-solid fa-envelope" aria-hidden="true" />
              <strong>Email:</strong> {parking.contact.email}
            </p>
          </div>
        </div>

        <div className={`${styles.sectionCard} ${styles.sectionServices}`}>
          <h3>
            <i className="fa-solid fa-concierge-bell" aria-hidden="true" /> Servicios
          </h3>
          <div className={styles.servicesGrid}>
            {parking.services.map((service) => (
              <div key={`${parking.id}-${service.value}`} className={styles.serviceItem}>
                <i className={service.icon} aria-hidden="true" /> {service.value}
              </div>
            ))}
          </div>
        </div>

        <div className={`${styles.sectionCard} ${styles.sectionFees}`}>
          <h3>
            <i className="fa-solid fa-money-bill-wave" aria-hidden="true" /> Tarifas
          </h3>
          <div className={styles.feesGrid}>
            {parking.fees.map((fee) => (
              <div key={fee.id} className={styles.feeItem}>
                <div className={styles.feeIcon}>
                  <i className={`fa-solid fa-${normalizeIconName(fee.icon)}`} aria-hidden="true" />
                </div>
                <div className={styles.feeDetails}>
                  <div className={styles.feeHeader}>
                    <span className={styles.vehicleType}>{fee.vehicleType}</span>
                    <span className={styles.feePrice}>{fee.price}</span>
                  </div>
                  <div className={styles.feeMeta}>
                    <span className={styles.feeTypeTag}>{capitalize(fee.feeType)}</span>
                    <span className={styles.feeUnit}>por {fee.timeUnit}</span>
                    {fee.appliesTo !== "all_week" ? (
                      <span className={styles.feeApplies}>
                        {fee.appliesTo === "weekdays" ? "Días de semana" : "Fines de semana"}
                      </span>
                    ) : null}
                    {fee.validFrom && fee.validTo ? (
                      <span className={styles.feeValidity}>
                        Válido: {formatDateLabel(fee.validFrom)} - {formatDateLabel(fee.validTo)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`${styles.sectionCard} ${styles.sectionDescription}`}>
          <h3>
            <i className="fa-solid fa-circle-info" aria-hidden="true" /> Descripcion
          </h3>
          <p>{parking.description}</p>
        </div>

        <div className={`${styles.sectionCard} ${styles.sectionRestrictions}`}>
          <h3>
            <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> Restricciones
          </h3>
          <div className={styles.restrictionsContainer}>
            <div className={styles.restrictionsSection}>
              <h4>Reglas de Comportamiento</h4>
              <div className={styles.restrictionsGrid}>
                {parking.restrictions.behavioral.map((restriction) => (
                  <div key={restriction} className={styles.restrictionItem}>
                    <i className="fa-solid fa-ban" aria-hidden="true" /> {capitalize(restriction)}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.restrictionsSection}>
              <h4>Restricciones Fisicas</h4>
              <div className={styles.physicalRestrictions}>
                <p>
                  <i className="fa-solid fa-arrows-up-down" aria-hidden="true" />
                  <strong>Altura máxima:</strong> {parking.restrictions.physical.maxHeight} metros
                </p>
                <p>
                  <i className="fa-solid fa-gauge-high" aria-hidden="true" />
                  <strong>Velocidad máxima:</strong> {parking.restrictions.physical.maxSpeed} km/h
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.sectionCard}>
          <h3>
            <i className="fa-solid fa-map-location-dot" aria-hidden="true" /> Ubicación precisa con
            mapas
          </h3>
          <div className={styles.mapsContainer}>
            <div className={styles.mapOption}>
              <button type="button" className={styles.mapButtonPrimary} onClick={() => openModal("google")}>
                <i className="fa-brands fa-google" aria-hidden="true" /> Ver en Google Maps
              </button>
              <button
                type="button"
                className={styles.mapButtonSecondary}
                onClick={() => void copyText(parking.location.googleMapsLink, "Enlace de Google Maps")}
              >
                <i className="fa-solid fa-copy" aria-hidden="true" /> Copiar enlace
              </button>
            </div>

            <div className={styles.mapOption}>
              <button type="button" className={styles.mapButtonPrimary} onClick={() => openModal("waze")}>
                <i className="fa-brands fa-waze" aria-hidden="true" /> Ver en Waze
              </button>
              <button
                type="button"
                className={styles.mapButtonSecondary}
                onClick={() => void copyText(parking.location.wazeLink, "Enlace de Waze")}
              >
                <i className="fa-solid fa-copy" aria-hidden="true" /> Copiar enlace
              </button>
            </div>
          </div>
        </div>

        <div className={styles.sectionCard}>
          <h3>
            <i className="fa-solid fa-star" aria-hidden="true" /> Reseñas y comentarios
          </h3>

          {sessionUser && !hasSubmittedReview ? (
            <form className={styles.newReviewForm} onSubmit={handleReviewSubmit}>
              <h4>Deja tu reseña</h4>
              <div className={styles.ratingStars}>
                {Array.from({ length: 5 }, (_, index) => {
                  const nextValue = index + 1;

                  return (
                    <button
                      key={`rating-button-${nextValue}`}
                      type="button"
                      className={`${styles.ratingStar} ${
                        reviewRating >= nextValue ? styles.ratingStarSelected : ""
                      }`}
                      onClick={() => setReviewRating(nextValue)}
                      aria-label={`Calificar con ${nextValue} estrellas`}
                    >
                      <i className="fa-solid fa-star" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
              <div className={styles.formGroup}>
                <textarea
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  placeholder="Escribe tu experiencia con este parqueo..."
                />
              </div>
              <button type="submit" className={styles.submitButton}>
                Enviar reseña
              </button>
            </form>
          ) : null}

          {!sessionUser ? (
            <p className={styles.loginMessage}>Inicia sesión para dejar una reseña</p>
          ) : null}

          <div className={styles.reviewsList}>
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className={styles.reviewItem}>
                  <div className={styles.reviewHeader}>
                    <img
                      src={review.avatar}
                      alt={`Avatar de ${review.author}`}
                      className={styles.reviewAvatar}
                    />
                    <div className={styles.reviewUser}>
                      <h4>{review.author}</h4>
                      <div className={styles.reviewRating}>
                        {Array.from({ length: 5 }, (_, index) => (
                          <i
                            key={`${review.id}-star-${index}`}
                            className={
                              index < review.rating ? "fa-solid fa-star" : "fa-regular fa-star"
                            }
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className={styles.reviewContent}>
                    <p>{review.comment}</p>
                    <small>{formatDateLabel(review.createdAt)}</small>
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.noReviews}>No hay reseñas todavía. Sé el primero en opinar.</p>
            )}
          </div>
        </div>

        <div className={styles.adCard}>
          <h3 className={styles.adTitle}>Anúnciate Aquí</h3>
          <p className={styles.adSubtitle}>Ejemplos de anunciantes potenciales:</p>
          <ul className={styles.adExamples}>
            <li>Lugares turísticos</li>
            <li>Carwash de autos</li>
            <li>Talleres mecánicos</li>
            <li>Tiendas de accesorios vehiculares</li>
            <li>Restaurantes cercanos</li>
            <li>Servicios de taxi</li>
          </ul>
        </div>
      </div>

      {fullscreenIndex !== null ? (
        <div className={styles.fullscreenGallery} onClick={closeFullscreenGallery}>
          <button
            type="button"
            className={styles.closeGallery}
            aria-label="Cerrar galeria"
            onClick={closeFullscreenGallery}
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
          {hasMultipleImages ? (
            <div className={styles.galleryNav}>
              <button
                type="button"
                className={styles.galleryNavButton}
                aria-label="Imagen anterior"
                onClick={(event) => {
                  event.stopPropagation();
                  moveGallery("prev");
                }}
              >
                <i className="fa-solid fa-chevron-left" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={styles.galleryNavButton}
                aria-label="Imagen siguiente"
                onClick={(event) => {
                  event.stopPropagation();
                  moveGallery("next");
                }}
              >
                <i className="fa-solid fa-chevron-right" aria-hidden="true" />
              </button>
            </div>
          ) : null}
          <div className={styles.galleryContent} onClick={(event) => event.stopPropagation()}>
            <img
              src={parking.images[fullscreenIndex]}
              alt={`Vista completa ${fullscreenIndex + 1} de ${parking.name}`}
              className={styles.fullscreenImage}
            />
            {hasMultipleImages ? (
              <div className={styles.imageCounter}>
                {fullscreenIndex + 1} / {totalImages}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <ModalShell
        isOpen={activeModal === "share"}
        title="Compartir este parqueo"
        onClose={closeModal}
      >
        <div className={styles.shareOptions}>
          <button type="button" className={styles.shareOption} onClick={shareOnFacebook}>
            <i className="fa-brands fa-facebook" aria-hidden="true" /> Facebook
          </button>
          <button type="button" className={styles.shareOption} onClick={shareOnTwitter}>
            <i className="fa-brands fa-twitter" aria-hidden="true" /> Twitter
          </button>
          <button type="button" className={styles.shareOption} onClick={shareOnWhatsApp}>
            <i className="fa-brands fa-whatsapp" aria-hidden="true" /> WhatsApp
          </button>
          <button
            type="button"
            className={styles.shareOption}
            onClick={() => void copyText(window.location.href, "Enlace")}
          >
            <i className="fa-solid fa-link" aria-hidden="true" /> Copiar enlace
          </button>
        </div>
      </ModalShell>

      <ModalShell isOpen={activeModal === "location"} title="Ubicación" onClose={closeModal}>
        <div className={styles.modalBody}>
          {hasDuplicateLocation(parking.department, parking.location.municipality) ? (
            <p>
              <strong>Ubicacion:</strong> {parking.department}
            </p>
          ) : (
            <>
              <p>
                <strong>Departamento:</strong> {parking.department}
              </p>
              <p>
                <strong>Municipio:</strong> {parking.location.municipality}
              </p>
            </>
          )}
          <p>
            <strong>Calle:</strong> {parking.location.streetAddress}
          </p>
          <p>
            <strong>Referencia:</strong> {parking.location.reference}
          </p>
        </div>
      </ModalShell>

      <ModalShell isOpen={activeModal === "capacity"} title="Capacidad" onClose={closeModal}>
        <div className={styles.modalBody}>
          <div className={styles.capacitySummary}>
            <p>
              <i className="fa-solid fa-car" aria-hidden="true" />
              <strong>Capacidad general:</strong> {parking.capacitySummary.general} vehículos
            </p>
            <p>
              <i className="fa-solid fa-calendar-check" aria-hidden="true" />
              <strong>Capacidad reservable general:</strong> {parking.capacitySummary.reservable} espacios
            </p>
            <p>
              <i className="fa-solid fa-wheelchair" aria-hidden="true" />
              <strong>Espacios para discapacitados:</strong> {parking.capacitySummary.disability}
            </p>
            <p>
              <i className="fa-solid fa-person-pregnant" aria-hidden="true" />
              <strong>Espacios para futuras mamás:</strong> {parking.capacitySummary.pregnant}
            </p>
            <p>
              <i className="fa-solid fa-taxi" aria-hidden="true" />
              <strong>Espacios para taxis:</strong> {parking.capacitySummary.taxi}
            </p>
            <p>
              <i className="fa-solid fa-bicycle" aria-hidden="true" />
              <strong>Espacios para bicicletas:</strong> {parking.capacitySummary.bicycle}
            </p>
          </div>

          <h4 className={styles.modalSubheading}>Capacidad por tipo de vehículo</h4>
          <div className={styles.vehicleCapacities}>
            {parking.vehicleCapacities.map((capacity) => (
              <div key={`${parking.id}-capacity-${capacity.id}`} className={styles.vehicleCapacityItem}>
                <div className={styles.vehicleIcon}>
                  <i
                    className={`fa-solid fa-${normalizeIconName(capacity.icon)}`}
                    aria-hidden="true"
                  />
                </div>
                <div className={styles.vehicleInfo}>
                  <div className={styles.vehicleName}>{capacity.categoryName}</div>
                  <div className={styles.vehicleCapacity}>{capacity.capacity} espacios</div>
                  {capacity.reservableCapacity > 0 ? (
                    <div className={styles.vehicleReservable}>
                      {capacity.reservableCapacity} reservables
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ModalShell>

      <ModalShell isOpen={activeModal === "schedule"} title="Horario" onClose={closeModal}>
        <div className={styles.modalBody}>
          <table className={styles.scheduleTable}>
            <tbody>
              {parking.is24_7 ? (
                <tr>
                  <td colSpan={2} className={styles.scheduleAlwaysOpen}>
                    <i className="fa-solid fa-clock" aria-hidden="true" /> Abierto 24/7 todos los días
                  </td>
                </tr>
              ) : (
                getOrderedDays().map((day) => (
                  <tr key={`${parking.id}-${day}`}>
                    <th>{capitalize(day)}</th>
                    <td>{formatScheduleForDay(parking, day)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ModalShell>

      <ModalShell isOpen={activeModal === "reserve"} title="Reservar espacio" onClose={closeModal}>
        <div className={styles.modalBody}>
          <div className={styles.reservationForm}>
            <label className={styles.reservationField}>
              <span>Tipo de vehiculo</span>
              <select
                value={reservationDraft.vehicleTypeId}
                onChange={(event) =>
                  setReservationDraft((current) => ({
                    ...current,
                    vehicleTypeId: Number(event.target.value),
                  }))
                }
              >
                {parking.vehicleCapacities.map((capacity) => (
                  <option key={capacity.id} value={capacity.id}>
                    {capacity.categoryName}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.reservationField}>
              <span>Inicio</span>
              <input
                type="datetime-local"
                value={reservationDraft.startAt}
                onChange={(event) =>
                  setReservationDraft((current) => ({
                    ...current,
                    startAt: event.target.value,
                  }))
                }
              />
            </label>

            <label className={styles.reservationField}>
              <span>Fin</span>
              <input
                type="datetime-local"
                value={reservationDraft.endAt}
                onChange={(event) =>
                  setReservationDraft((current) => ({
                    ...current,
                    endAt: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <button
            type="button"
            className={styles.reserveConfirmButton}
            disabled={isReserving || parking.vehicleCapacities.length === 0}
            onClick={saveReservation}
          >
            <i className={`fa-solid ${isReserving ? "fa-spinner fa-spin" : "fa-calendar-check"}`} aria-hidden="true" />
            <span>{isReserving ? "Reservando..." : "Confirmar reserva"}</span>
          </button>
        </div>
      </ModalShell>

      <ModalShell
        isOpen={activeModal === "google"}
        title="Ubicación en Google Maps"
        onClose={closeModal}
        large
      >
        <div className={styles.modalBody}>
          <iframe
            src={parking.location.googleMapsEmbed}
            title={`Mapa de ${parking.name} en Google Maps`}
            className={styles.mapFrame}
            loading="lazy"
          />
        </div>
      </ModalShell>

      <ModalShell isOpen={activeModal === "waze"} title="Navegar con Waze" onClose={closeModal} large>
        <div className={styles.modalBody}>
          <iframe
            src={parking.location.wazeEmbed}
            title={`Mapa de ${parking.name} en Waze`}
            className={styles.mapFrame}
            loading="lazy"
          />
        </div>
      </ModalShell>

      {notification ? (
        <div
          className={`${styles.notification} ${
            notification.type === "success" ? styles.notificationSuccess : styles.notificationError
          }`}
        >
          {notification.message}
        </div>
      ) : null}
    </section>
  );
}

function ModalShell({
  children,
  isOpen,
  large = false,
  onClose,
  title,
}: {
  children: ReactNode;
  isOpen: boolean;
  large?: boolean;
  onClose: () => void;
  title: string;
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={`${styles.modalContent} ${large ? styles.largeModal : ""}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className={styles.closeModalButton} aria-label="Cerrar modal" onClick={onClose}>
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

function resolveGalleryLayoutClass(imageCount: number) {
  switch (imageCount) {
    case 1:
      return styles.galleryOne;
    case 2:
      return styles.galleryTwo;
    case 3:
      return styles.galleryThree;
    case 4:
      return styles.galleryFour;
    default:
      return styles.galleryFive;
  }
}

function formatCategoryLabel(value: string) {
  return value
    .split("_")
    .map((segment) => capitalize(segment))
    .join(" ");
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function normalizeIconName(icon: string) {
  return iconAliases[icon] ?? icon;
}

function getOrderedDays(): ParkingDayKey[] {
  return ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
}

function formatScheduleForDay(parking: Parking, day: ParkingDayKey) {
  const slots = parking.schedule[day] ?? [];

  if (slots.length === 0) {
    return "Cerrado";
  }

  return slots.map((slot) => `${formatHour(slot.apertura)} - ${formatHour(slot.cierre)}`).join(" / ");
}

function formatHour(value: string) {
  const [rawHours, rawMinutes] = value.split(":");
  const hours = Number(rawHours);
  const minutes = Number(rawMinutes);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;

  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function formatDateLabel(value: string) {
  const rawDate = value.includes("T") ? new Date(value) : new Date(`${value}T00:00:00`);

  if (Number.isNaN(rawDate.getTime())) {
    return "Fecha no disponible";
  }

  return new Intl.DateTimeFormat("es-SV", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(rawDate);
}

function hasDuplicateLocation(department: string, municipality: string) {
  return normalizeTextValue(department) === normalizeTextValue(municipality);
}

function normalizeTextValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
