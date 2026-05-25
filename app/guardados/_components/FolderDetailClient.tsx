"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { SavedParkingCard } from "@/app/guardados/_components/SavedParkingCard";
import {
  getFolderById,
  getParkingsByIds,
  getParkingCountLabel,
  getSavedParkingSnapshot,
  getServerSavedParkingSnapshot,
  parseSavedParkingSnapshot,
  removeParkingEverywhere,
  removeParkingFromFolder,
  subscribeToSavedParkingState,
  writeSavedParkingState,
} from "@/app/guardados/_lib/saved-parking-store";
import styles from "../guardados.module.css";

type FolderDetailClientProps = {
  folderId: string;
};

export default function FolderDetailClient({ folderId }: FolderDetailClientProps) {
  const snapshot = useSyncExternalStore(
    subscribeToSavedParkingState,
    getSavedParkingSnapshot,
    getServerSavedParkingSnapshot,
  );
  const savedState = parseSavedParkingSnapshot(snapshot);
  const folder = getFolderById(savedState, folderId);
  const parkings = getParkingsByIds(folder?.parkingIds ?? []);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function handleRemoveFromFolder(parkingId: string, parkingName: string) {
    if (!folder) {
      return;
    }

    writeSavedParkingState(removeParkingFromFolder(savedState, folder.id, parkingId));
    setNotice(`${parkingName} ahora quedo como favorito sin carpeta.`);
  }

  function handleRemoveFavorite(parkingId: string, parkingName: string) {
    writeSavedParkingState(removeParkingEverywhere(savedState, parkingId));
    setNotice(`Parqueo eliminado de favoritos: ${parkingName}`);
  }

  if (!folder) {
    return (
      <section className={styles.page}>
        <div className={styles.shell}>
          <Link href="/guardados" className={styles.backLink}>
            <i className="fas fa-arrow-left" aria-hidden="true" />
            <span>Volver a guardados</span>
          </Link>

          <div className={styles.emptyState}>
            <Image
              src="/parkingsv/bubble-accent.png"
              alt="Carpeta no encontrada"
              className={styles.emptyIllustration}
              width={220}
              height={220}
            />
            <h3>Esta carpeta ya no existe</h3>
            <p>
              Puede que la carpeta se haya eliminado del navegador o que su identificador haya
              cambiado. Puedes regresar a tu biblioteca y crear otra cuando quieras.
            </p>
            <Link href="/guardados" className={styles.exploreButton}>
              <span>Ir a mis guardados</span>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.shell}>
        <Link href="/guardados" className={styles.backLink}>
          <i className="fas fa-arrow-left" aria-hidden="true" />
          <span>Volver a guardados</span>
        </Link>

        <header className={styles.folderHero}>
          <div className={styles.folderHeroIcon} style={{ backgroundColor: folder.color }}>
            <i className="fas fa-folder" aria-hidden="true" />
          </div>

          <div className={styles.folderHeroContent}>
            <span className={styles.folderBadge}>Carpeta guardada</span>
            <h1>{folder.name}</h1>
            <p>
              {getParkingCountLabel(parkings.length)} guardados en esta carpeta para mantener tu
              seleccion organizada y lista para consultar.
            </p>
          </div>
        </header>

        {parkings.length > 0 ? (
          <div className={styles.parkingGrid}>
            {parkings.map((parking) => (
              <SavedParkingCard
                key={parking.id}
                parking={parking}
                onToggleFavorite={() => handleRemoveFavorite(parking.id, parking.name)}
                secondaryAction={{
                  label: "Quitar de carpeta",
                  icon: "fas fa-folder-minus",
                  onClick: () => handleRemoveFromFolder(parking.id, parking.name),
                }}
              />
            ))}
          </div>
        ) : (
          <div className={`${styles.emptyState} ${styles.emptyFolders}`}>
            <Image
              src="/parkingsv/parking-lot.png"
              alt="Carpeta vacía"
              className={styles.emptyIllustration}
              width={220}
              height={220}
            />
            <h3>Esta carpeta esta vacía</h3>
            <p>
              Aún no hay parqueos dentro de esta carpeta. Puedes volver a guardados y mover
              favoritos sueltos aquí cuando los tengas.
            </p>
            <Link href="/guardados" className={styles.exploreButton}>
              <span>Volver a la biblioteca</span>
            </Link>
          </div>
        )}
      </div>

      {notice ? (
        <div className={styles.notice} role="status">
          {notice}
        </div>
      ) : null}
    </section>
  );
}
