"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { SavedParkingCard } from "@/app/guardados/_components/SavedParkingCard";
import {
  buildUnassignedFavoriteIds,
  createFolderInState,
  getParkingsByIds,
  getParkingCountLabel,
  getSavedParkingSnapshot,
  getServerSavedParkingSnapshot,
  parseSavedParkingSnapshot,
  removeParkingEverywhere,
  subscribeToSavedParkingState,
  writeSavedParkingState,
} from "@/app/guardados/_lib/saved-parking-store";
import styles from "./guardados.module.css";

const colorOptions = ["#0C6FF9", "#4CAF50", "#FF5722", "#9C27B0", "#FFC107"];

export default function GuardadosClient() {
  const snapshot = useSyncExternalStore(
    subscribeToSavedParkingState,
    getSavedParkingSnapshot,
    getServerSavedParkingSnapshot,
  );
  const savedState = parseSavedParkingSnapshot(snapshot);
  const looseFavoriteIds = buildUnassignedFavoriteIds(savedState);
  const looseFavorites = getParkingsByIds(looseFavoriteIds);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);
  const [selectedParkingIds, setSelectedParkingIds] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!isPanelOpen) {
      return;
    }

    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;

      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }

      setIsPanelOpen(false);
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isPanelOpen]);

  function handleToggleSelection(parkingId: string) {
    setSelectedParkingIds((current) =>
      current.includes(parkingId)
        ? current.filter((currentId) => currentId !== parkingId)
        : [...current, parkingId],
    );
  }

  function handleCreateFolder() {
    const trimmedName = folderName.trim();

    if (!trimmedName) {
      setNotice("Por favor, ingresa un nombre para la carpeta.");
      return;
    }

    const nextState = createFolderInState(savedState, {
      name: trimmedName,
      color: selectedColor,
      parkingIds: selectedParkingIds,
    });

    writeSavedParkingState(nextState);
    setFolderName("");
    setSelectedParkingIds([]);
    setSelectedColor(colorOptions[0]);
    setIsPanelOpen(false);
    setNotice(
      selectedParkingIds.length > 0
        ? "Carpeta creada y favoritos organizados."
        : "Carpeta creada. Puedes agregar favoritos luego.",
    );
  }

  function handleRemoveFavorite(parkingId: string, parkingName: string) {
    writeSavedParkingState(removeParkingEverywhere(savedState, parkingId));
    setSelectedParkingIds((current) => current.filter((currentId) => currentId !== parkingId));
    setNotice(`Parqueo eliminado de favoritos: ${parkingName}`);
  }

  return (
    <section className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.pageHeader}>
          <h1>
            Mis <span>favoritos</span>
          </h1>
          <p>
            Organiza tus parqueos guardados en carpetas y manten tu biblioteca siempre a mano.
          </p>
        </header>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <h2>Carpetas</h2>
            <p>Organiza tus parqueos favoritos para encontrarlos mas rapido.</p>
          </div>

          {savedState.folders.length > 0 ? (
            <div className={styles.foldersGrid}>
              {savedState.folders.map((folder) => (
                <Link
                  key={folder.id}
                  href={`/guardados/carpeta/${folder.id}`}
                  className={styles.folderCard}
                  style={{ backgroundColor: folder.color }}
                >
                  <div className={styles.folderIcon}>
                    <i className="fas fa-folder" aria-hidden="true" />
                  </div>
                  <h3>{folder.name}</h3>
                  <p>{getParkingCountLabel(folder.parkingIds.length)}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className={`${styles.emptyState} ${styles.emptyFolders}`}>
              <Image
                src="/parkingsv/bubble-accent.png"
                alt="Carpetas vacías"
                className={styles.emptyIllustration}
                width={220}
                height={220}
              />
              <h3>Tu biblioteca de parqueos esta vacía</h3>
              <p>
                Organiza tus parqueos favoritos en carpetas temáticas para encontrarlos fácilmente.
                Crea tu primera carpeta y luego podrás abrirla para revisar su contenido.
              </p>
              <div className={styles.hintCard}>
                <p>
                  Usa el boton flotante <i className="fas fa-plus-circle" aria-hidden="true" />{" "}
                  para crear tu primera carpeta.
                </p>
              </div>
            </div>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <h2>Favoritos sin carpeta</h2>
            <p>Estos parqueos siguen guardados, pero todavía no los has organizado.</p>
          </div>

          {looseFavorites.length > 0 ? (
            <div className={styles.parkingGrid}>
              {looseFavorites.map((parking) => (
                <SavedParkingCard
                  key={parking.id}
                  parking={parking}
                  onToggleFavorite={() => handleRemoveFavorite(parking.id, parking.name)}
                />
              ))}
            </div>
          ) : (
            <div className={`${styles.emptyState} ${styles.emptyFavorites}`}>
              <Image
                src="/parkingsv/parking-lot.png"
                alt="No hay favoritos sueltos"
                className={styles.emptyIllustration}
                width={220}
                height={220}
              />
              {savedState.favoriteIds.length > 0 ? (
                <>
                  <h3>Tus favoritos ya estan organizados</h3>
                  <p>
                    Muy bien: por ahora no tienes favoritos sueltos porque ya los moviste a
                    carpetas. Puedes crear otra carpeta o seguir explorando parqueos.
                  </p>
                </>
              ) : (
                <>
                  <h3>Zona de parqueos desorganizada</h3>
                  <p>
                    Parece que aún no has guardado parqueos en esta versión de Next. Explora los
                    parqueos disponibles y empieza a construir tu colección.
                  </p>
                </>
              )}

              <Link href="/parqueos" className={styles.exploreButton}>
                <Image src="/parkingsv/parkings-icon.png" alt="Parqueos" width={22} height={22} />
                <span>Ver parqueos disponibles</span>
              </Link>
            </div>
          )}
        </section>
      </div>

      <div className={styles.floatingFolderCreator}>
        <button
          ref={triggerRef}
          type="button"
          className={styles.quickFolderButton}
          aria-label={isPanelOpen ? "Cerrar creador de carpetas" : "Crear carpeta"}
          onClick={() => setIsPanelOpen((current) => !current)}
        >
          <i className={`fas ${isPanelOpen ? "fa-xmark" : "fa-plus"}`} aria-hidden="true" />
        </button>

        <div
          ref={panelRef}
          className={`${styles.folderCreationPanel} ${isPanelOpen ? styles.folderCreationPanelOpen : ""}`}
        >
          <h3>Nueva carpeta</h3>

          <label className={styles.formLabel} htmlFor="quick-folder-name">
            Nombre de la carpeta
          </label>
          <input
            id="quick-folder-name"
            type="text"
            value={folderName}
            className={styles.textInput}
            placeholder="Nombre de la carpeta"
            onChange={(event) => setFolderName(event.target.value)}
          />

          <div className={styles.formGroup}>
            <span className={styles.formLabel}>Color</span>
            <div className={styles.colorOptions}>
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`${styles.colorOption} ${
                    selectedColor === color ? styles.colorOptionActive : ""
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Seleccionar color ${color}`}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <span className={styles.formLabel}>Seleccionar favoritos iniciales</span>
            <div className={styles.selectionList}>
              {looseFavorites.length > 0 ? (
                looseFavorites.map((parking) => {
                  const checked = selectedParkingIds.includes(parking.id);

                  return (
                    <label key={parking.id} className={styles.selectionItem}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleSelection(parking.id)}
                      />
                      <span>{parking.name}</span>
                    </label>
                  );
                })
              ) : (
                <p className={styles.helperText}>
                  No tienes favoritos sueltos por ahora. Puedes crear la carpeta vacia y llenarla
                  mas adelante con los parqueos que prefieras.
                </p>
              )}
            </div>
          </div>

          <button type="button" className={styles.createFolderAction} onClick={handleCreateFolder}>
            <i className="fas fa-plus-circle" aria-hidden="true" />
            <span>Crear carpeta</span>
          </button>
        </div>
      </div>

      {notice ? (
        <div className={styles.notice} role="status">
          {notice}
        </div>
      ) : null}
    </section>
  );
}
