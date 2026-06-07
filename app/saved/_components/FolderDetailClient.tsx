"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SavedParkingCard } from "@/app/saved/_components/SavedParkingCard";
import { FolderAssignmentModal } from "@/app/saved/_components/FolderAssignmentModal";
import type { Parking } from "@/app/parkings/parking-data";
import {
  getFolderById,
  getParkingCountLabel,
  getParkingsByIds,
  type SavedParkingState,
} from "@/app/saved/_lib/saved-helpers";
import styles from "../saved.module.css";

type FolderDetailClientProps = {
  folderId: string;
  initialState: SavedParkingState;
  parkings: Parking[];
};

export default function FolderDetailClient({
  folderId,
  initialState,
  parkings,
}: FolderDetailClientProps) {
  const [savedState, setSavedState] = useState(initialState);
  const folder = getFolderById(savedState, folderId);
  const folderParkings = getParkingsByIds(parkings, folder?.parkingIds ?? []);
  const [notice, setNotice] = useState("");
  const [assignmentTarget, setAssignmentTarget] = useState<Parking | null>(null);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function openAssignmentModal(parking: Parking) {
    setAssignmentTarget(parking);
  }

  async function handleRemoveFavorite(parkingId: string, parkingName: string) {
    const response = await fetch("/api/favorites", {
      body: JSON.stringify({
        action: "remove_favorite",
        parkingId: Number(parkingId),
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const payload = (await response.json()) as {
      error?: string;
      state?: SavedParkingState;
    };

    if (!response.ok || !payload.state) {
      setNotice(payload.error ?? "No se pudo eliminar el favorito.");
      return;
    }

    setSavedState(payload.state);
    setNotice(`Parqueo eliminado de favoritos: ${parkingName}`);
  }

  async function handleSaveFavorite(folderId: string | null) {
    if (!assignmentTarget) {
      return;
    }

    const response = await fetch("/api/favorites", {
      body: JSON.stringify({
        action: "save_favorite",
        folderId: folderId === null ? null : Number(folderId),
        parkingId: Number(assignmentTarget.dbId),
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const payload = (await response.json()) as {
      error?: string;
      state?: SavedParkingState;
    };

    if (!response.ok || !payload.state) {
      setNotice(payload.error ?? "No se pudo actualizar el parqueo.");
      return;
    }

    setSavedState(payload.state);
    setAssignmentTarget(null);
    setNotice(
      folderId === null
        ? `${assignmentTarget.name} quedó como favorito sin carpeta.`
        : `${assignmentTarget.name} se movió a una carpeta diferente.`,
    );
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
              Puede que la carpeta se haya eliminado o que su identificador ya no sea válido.
              Puedes regresar a tu biblioteca y crear otra cuando quieras.
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
              {getParkingCountLabel(folderParkings.length)} guardados en esta carpeta para mantener tu
              seleccion organizada y lista para consultar.
            </p>
          </div>
        </header>

        {folderParkings.length > 0 ? (
          <div className={styles.parkingGrid}>
            {folderParkings.map((parking) => (
              <SavedParkingCard
                key={parking.id}
                parking={parking}
                onToggleFavorite={() => void handleRemoveFavorite(parking.id, parking.name)}
                secondaryAction={{
                  label: "Cambiar carpeta",
                  icon: "fas fa-folder-open",
                  onClick: () => openAssignmentModal(parking),
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

      {folder && assignmentTarget ? (
        <FolderAssignmentModal
          confirmLabel="Guardar cambios"
          currentFolderId={folder.id}
          folders={savedState.folders}
          isOpen
          onClose={() => setAssignmentTarget(null)}
          onConfirm={(nextFolderId) => void handleSaveFavorite(nextFolderId)}
          parking={assignmentTarget}
          title={`Mover parqueo de ${folder.name}`}
        />
      ) : null}
    </section>
  );
}
