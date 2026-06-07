"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { CustomerReservation, ReservationStatus } from "@/app/lib/reservations";
import styles from "./my-reservations.module.css";

type ReservationsClientProps = {
  reservations: CustomerReservation[];
};

export default function ReservationsClient({ reservations }: ReservationsClientProps) {
  const [activeReservationId, setActiveReservationId] = useState<string | null>(null);
  const activeReservation = useMemo(
    () => reservations.find((reservation) => reservation.id === activeReservationId) ?? null,
    [activeReservationId, reservations],
  );

  return (
    <section className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <h1>Mis reservas</h1>
          <p>
            Aquí puedes revisar tus espacios reservados, su estado y acceder al código QR de cada
            uno.
          </p>
        </header>

        <section className={styles.inlineAd}>
          <div className={styles.inlineAdContent}>
            <span className={styles.inlineAdEyebrow}>Espacio para patrocinadores</span>
            <h2>Anúnciate aquí</h2>
            <p>
              Una zona ideal para promociones de restaurantes, talleres, carwash o comercios
              asociados al viaje.
            </p>
          </div>
          <Link href="/sobre-nosotros" className={styles.inlineAdLink}>
            Solicitar espacio
          </Link>
        </section>

        {reservations.length > 0 ? (
          <div className={styles.grid}>
            {reservations.map((reservation) => (
              <article key={reservation.id} className={styles.card}>
                <Image
                  src={reservation.parking.image}
                  alt={reservation.parking.name}
                  className={styles.cardImage}
                  width={720}
                  height={420}
                />

                <div className={styles.cardContent}>
                  <div className={styles.cardTop}>
                    <h2>{reservation.parking.name}</h2>
                    <span
                      className={`${styles.statusBadge} ${resolveStatusClassName(styles, reservation.status)}`}
                    >
                      {reservation.status}
                    </span>
                  </div>

                  <p className={styles.location}>
                    {formatParkingLocation(
                      reservation.parking.department,
                      reservation.parking.municipality,
                    )}
                  </p>
                  <p>
                    <strong>Vehículo:</strong> {reservation.vehicleCategory}
                  </p>
                  <p>
                    <strong>Inicio:</strong> {formatDate(reservation.startAt)}
                  </p>
                  <p>
                    <strong>Fin:</strong> {formatDate(reservation.endAt)}
                  </p>

                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.primaryAction}
                      onClick={() => setActiveReservationId(reservation.id)}
                    >
                      Ver QR
                    </button>
                    <Link href={`/parqueos/${reservation.parking.id}`} className={styles.secondaryAction}>
                      Ver parqueo
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <i className="fas fa-calendar-times" aria-hidden="true" />
            <h2>Aún no tienes reservas</h2>
            <p>
              Explora parqueos y crea tu primera reserva para completar tu experiencia dentro de
              Parking SV.
            </p>
            <Link href="/parqueos" className={styles.primaryAction}>
              Buscar parqueos
            </Link>
          </div>
        )}
      </div>

      {activeReservation ? (
        <div
          className={styles.modal}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setActiveReservationId(null);
            }
          }}
        >
          <div className={styles.modalContent}>
            <button
              type="button"
              className={styles.closeButton}
              aria-label="Cerrar QR"
              onClick={() => setActiveReservationId(null)}
            >
              &times;
            </button>

            <div className={styles.qrCard}>
              <div className={styles.qrVisual} aria-hidden="true">
                <div className={styles.qrPattern} />
              </div>

              <div className={styles.qrDetails}>
                <h3>{activeReservation.parking.name}</h3>
                <p>
                  Presenta este codigo al ingresar para validar tu acceso al parqueo.
                </p>
                <p>
                  <strong>Código:</strong> {activeReservation.qrCode}
                </p>
                <p>
                  <strong>Horario:</strong> {formatDate(activeReservation.startAt)} a{" "}
                  {formatDate(activeReservation.endAt)}
                </p>
                <span
                  className={`${styles.statusBadge} ${resolveStatusClassName(styles, activeReservation.status)}`}
                >
                  {activeReservation.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  const datePart = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
  const hour = date.getHours();
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  const timePart = `${String(displayHour).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")} ${suffix}`;

  return `${datePart} ${timePart}`;
}

function resolveStatusClassName(
  moduleStyles: Record<string, string>,
  status: ReservationStatus,
) {
  switch (status) {
    case "Reservado":
      return moduleStyles.statusReservado;
    case "Usado":
      return moduleStyles.statusUsado;
    case "Cancelado":
      return moduleStyles.statusCancelado;
    case "Sancionado":
      return moduleStyles.statusCancelado;
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
