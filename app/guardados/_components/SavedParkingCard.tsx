"use client";

import Image from "next/image";
import Link from "next/link";
import type { Parking } from "@/app/parqueos/parking-data";
import {
  formatParkingSchedule,
  getParkingImage,
} from "@/app/guardados/_lib/saved-parking-store";
import styles from "../guardados.module.css";

type SecondaryAction = {
  icon: string;
  label: string;
  onClick: () => void;
};

type SavedParkingCardProps = {
  parking: Parking;
  secondaryAction?: SecondaryAction;
  onToggleFavorite: () => void;
};

export function SavedParkingCard({
  parking,
  secondaryAction,
  onToggleFavorite,
}: SavedParkingCardProps) {
  return (
    <article className={styles.parkingCard}>
      <div className={styles.parkingCardMedia}>
        <button
          type="button"
          className={styles.saveIcon}
          aria-label={`Quitar ${parking.name} de favoritos`}
          onClick={onToggleFavorite}
        >
          <i className="fas fa-bookmark" aria-hidden="true" />
        </button>

        {parking.rating === null ? <span className={styles.newBadge}>Nuevo</span> : null}

        <Image
          src={getParkingImage(parking)}
          alt={parking.name}
          fill
          sizes="(max-width: 680px) 100vw, (max-width: 1180px) 50vw, 360px"
          className={styles.parkingImage}
        />
      </div>

      <div className={styles.parkingContent}>
        <div className={styles.parkingHeading}>
          <h3>{parking.name}</h3>
          <p className={styles.parkingLocation}>
            <i className="fas fa-location-dot" aria-hidden="true" />
            <span>{formatParkingLocation(parking.department, parking.municipality)}</span>
          </p>
        </div>

        <div className={styles.parkingMetaRow}>
          <p className={styles.parkingSchedule}>
            <i className="far fa-clock" aria-hidden="true" />
            <span>{formatParkingSchedule(parking)}</span>
          </p>

          {parking.rating === null ? null : (
            <span className={styles.ratingBadge}>
              <span>{parking.rating.toFixed(1)}</span>
              <i className="fas fa-star" aria-hidden="true" />
            </span>
          )}
        </div>

        <div className={styles.cardActions}>
          <Link href={`/parqueos/${parking.id}`} className={styles.primaryCardAction}>
            <span>Ver detalles</span>
            <i className="fas fa-arrow-right" aria-hidden="true" />
          </Link>

          {secondaryAction ? (
            <button
              type="button"
              className={styles.secondaryCardAction}
              onClick={secondaryAction.onClick}
            >
              <i className={secondaryAction.icon} aria-hidden="true" />
              <span>{secondaryAction.label}</span>
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
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
