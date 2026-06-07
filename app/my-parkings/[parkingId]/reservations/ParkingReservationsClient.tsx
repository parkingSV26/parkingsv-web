"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type {
  OwnerReservation,
  ReservationStatus,
} from "@/app/lib/reservations";
import type { Parking } from "@/app/parkings/parking-data";
import styles from "./parking-reservations.module.css";

type ParkingReservationsClientProps = {
  parking: Parking;
  reservations: OwnerReservation[];
};

type StatusFilter = "all" | ReservationStatus;

export default function ParkingReservationsClient({
  parking,
  reservations,
}: ParkingReservationsClientProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeReservationId, setActiveReservationId] = useState<string | null>(null);

  const filteredReservations = useMemo(() => {
    const normalizedQuery = normalizeText(searchQuery);

    return reservations.filter((reservation) => {
      const matchesStatus =
        statusFilter === "all" ? true : reservation.status === statusFilter;
      const matchesQuery = normalizedQuery
        ? normalizeText(
            `${reservation.customer.name} ${reservation.customer.email} ${reservation.vehicleCategory}`,
          ).includes(normalizedQuery)
        : true;

      return matchesStatus && matchesQuery;
    });
  }, [reservations, searchQuery, statusFilter]);

  const activeReservation =
    activeReservationId
      ? reservations.find((reservation) => reservation.id === activeReservationId) ?? null
      : null;
  const reservedCount = reservations.filter((reservation) => reservation.status === "Reservado").length;
  const usedCount = reservations.filter((reservation) => reservation.status === "Usado").length;
  const cancelledCount = reservations.filter((reservation) => reservation.status === "Cancelado").length;
  const sanctionedCount = reservations.filter((reservation) => reservation.status === "Sancionado").length;

  return (
    <section className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.breadcrumbs}>
          <Link href="/mis-parqueos">Mis parqueos</Link>
          <span>/</span>
          <span>Inspeccionar reservas</span>
        </div>

        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Panel propietario</p>
            <h1>Inspeccionar reservas de {parking.name}</h1>
            <p>
              Revisa que usuarios reportaron una reserva, por cuanto tiempo apartaron espacio y
              cual es el monto asociado a cada operacion.
            </p>
          </div>

          <div className={styles.heroCard}>
            <Image
              src={parking.image}
              alt={parking.name}
              width={320}
              height={210}
              className={styles.heroImage}
            />
            <div className={styles.heroMeta}>
              <strong>{parking.businessName}</strong>
              <span>{formatParkingLocation(parking.department, parking.municipality)}</span>
              <Link href={`/parqueos/${parking.id}`} className={styles.heroLink}>
                Ver parqueo publicado
              </Link>
            </div>
          </div>
        </header>

        <section className={styles.summaryGrid}>
          <article className={styles.summaryCard}>
            <strong>{reservations.length}</strong>
            <span>reservas registradas</span>
          </article>
          <article className={styles.summaryCard}>
            <strong>{reservedCount}</strong>
            <span>pendientes por llegar</span>
          </article>
          <article className={styles.summaryCard}>
            <strong>{cancelledCount}</strong>
            <span>canceladas</span>
          </article>
          <article className={styles.summaryCard}>
            <strong>{sanctionedCount}</strong>
            <span>sancionadas</span>
          </article>
        </section>

        <section className={styles.banner}>
          <div>
            <p className={styles.bannerEyebrow}>Estado general</p>
            <h2>Control rapido del parqueo</h2>
            <p>
              Confirmadas: {reservedCount} | Usadas: {usedCount} | Canceladas: {cancelledCount} | Sancionadas:{" "}
              {sanctionedCount}
            </p>
          </div>
          <Link href="/mis-parqueos" className={styles.bannerAction}>
            Administrar publicacion
          </Link>
        </section>

        <section className={styles.toolbar}>
          <div className={styles.searchBar}>
            <i className="fa-solid fa-search" aria-hidden="true" />
            <input
              type="text"
              placeholder="Buscar por cliente, correo o placa..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <div className={styles.filterRow}>
            {(["all", "Reservado", "Usado", "Cancelado"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                className={`${styles.filterChip} ${
                  statusFilter === filter ? styles.filterChipActive : ""
                }`}
                onClick={() => setStatusFilter(filter)}
              >
                {filter === "all" ? "Todos" : filter}
              </button>
            ))}
          </div>
        </section>

        {filteredReservations.length > 0 ? (
          <div className={styles.list}>
            {filteredReservations.map((reservation) => (
              <article key={reservation.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h2>{reservation.customer.name}</h2>
                    <p>{reservation.customer.email}</p>
                  </div>
                  <span
                    className={`${styles.statusBadge} ${resolveStatusClassName(styles, reservation.status)}`}
                  >
                    {reservation.status}
                  </span>
                </div>

                <div className={styles.infoGrid}>
                  <div>
                    <span className={styles.label}>Horario</span>
                    <strong>{formatDateRange(reservation.startAt, reservation.endAt)}</strong>
                  </div>
                  <div>
                    <span className={styles.label}>Codigo QR</span>
                    <strong>{reservation.qrCode}</strong>
                  </div>
                  <div>
                    <span className={styles.label}>Vehiculo</span>
                    <strong>{reservation.vehicleCategory}</strong>
                  </div>
                  <div>
                    <span className={styles.label}>Telefono</span>
                    <strong>{reservation.customer.phone ?? "No registrado"}</strong>
                  </div>
                  <div>
                    <span className={styles.label}>Creada</span>
                    <strong>{formatDate(reservation.createdAt)}</strong>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.note}>
                    <span className={styles.label}>Cliente</span>
                    <p>{reservation.customer.email}</p>
                  </div>
                  <button
                    type="button"
                    className={styles.inspectButton}
                    onClick={() => setActiveReservationId(reservation.id)}
                  >
                    <i className="fa-solid fa-clipboard-list" aria-hidden="true" />
                    <span>Inspeccionar reserva</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <i className="fa-solid fa-calendar-xmark" aria-hidden="true" />
            <h2>No hay reservas que coincidan</h2>
            <p>
              Ajusta el filtro o la busqueda para encontrar una reserva con la informacion que
              necesitas revisar.
            </p>
          </div>
        )}
      </div>

      {activeReservation ? (
        <div
          className={styles.modalBackdrop}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setActiveReservationId(null);
            }
          }}
        >
          <div className={styles.modalCard}>
            <button
              type="button"
              className={styles.closeButton}
              aria-label="Cerrar detalle de reserva"
              onClick={() => setActiveReservationId(null)}
            >
              &times;
            </button>

            <div className={styles.modalTop}>
              <div>
                <p className={styles.eyebrow}>Reserva</p>
                <h3>{activeReservation.customer.name}</h3>
                <span
                  className={`${styles.statusBadge} ${resolveStatusClassName(styles, activeReservation.status)}`}
                >
                  {activeReservation.status}
                </span>
              </div>
              <div className={styles.qrBadge}>
                <span>QR</span>
                <strong>{activeReservation.qrCode}</strong>
              </div>
            </div>

            <div className={styles.modalGrid}>
              <div className={styles.modalPanel}>
                <span className={styles.label}>Contacto</span>
                <p>{activeReservation.customer.email}</p>
                <p>{activeReservation.customer.phone ?? "Telefono no registrado"}</p>
              </div>
              <div className={styles.modalPanel}>
                <span className={styles.label}>Reserva creada</span>
                <p>{formatDate(activeReservation.createdAt)}</p>
              </div>
              <div className={styles.modalPanel}>
                <span className={styles.label}>Ingreso y salida</span>
                <p>{formatDate(activeReservation.startAt)}</p>
                <p>{formatDate(activeReservation.endAt)}</p>
              </div>
              <div className={styles.modalPanel}>
                <span className={styles.label}>Vehiculo</span>
                <p>{activeReservation.vehicleCategory}</p>
              </div>
              <div className={styles.modalPanel}>
                <span className={styles.label}>Estado y acceso</span>
                <p>{activeReservation.status}</p>
                <p>QR: {activeReservation.qrCode}</p>
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
  const datePart = `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}/${date.getFullYear()}`;
  const hour = date.getHours();
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  const timePart = `${String(displayHour).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")} ${suffix}`;

  return `${datePart} ${timePart}`;
}

function formatDateRange(startAt: string, endAt: string) {
  return `${formatDate(startAt)} - ${formatDate(endAt)}`;
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

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatParkingLocation(department: string, municipality: string) {
  return normalizeText(department) === normalizeText(municipality)
    ? department
    : `${department}, ${municipality}`;
}
