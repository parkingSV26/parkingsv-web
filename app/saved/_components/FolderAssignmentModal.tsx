"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { Parking } from "@/app/parkings/parking-data";
import type { SavedFolder } from "@/app/saved/_lib/saved-helpers";
import styles from "../saved.module.css";

type FolderAssignmentModalProps = {
  confirmLabel: string;
  currentFolderId: string | null;
  folders: SavedFolder[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (folderId: string | null) => void;
  parking: Parking;
  title: string;
};

export function FolderAssignmentModal({
  confirmLabel,
  currentFolderId,
  folders,
  isOpen,
  onClose,
  onConfirm,
  parking,
  title,
}: FolderAssignmentModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentFolderId);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelectedFolderId(currentFolderId);
  }, [currentFolderId, isOpen, parking.id]);

  const selectedFolder = useMemo(
    () => folders.find((folder) => folder.id === selectedFolderId) ?? null,
    [folders, selectedFolderId],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderText}>
            <p className={styles.modalEyebrow}>Guardar parqueo</p>
            <h2>{title}</h2>
          </div>

          <button type="button" className={styles.modalCloseButton} onClick={onClose} aria-label="Cerrar modal">
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <div className={styles.modalParkingRow}>
          <Image
            src={parking.image}
            alt={parking.name}
            width={120}
            height={84}
            className={styles.modalParkingImage}
          />
          <div>
            <h3>{parking.name}</h3>
            <p>{formatParkingLocation(parking.department, parking.municipality)}</p>
          </div>
        </div>

        <p className={styles.modalHint}>
          Elige una carpeta existente o guárdalo solo para dejarlo fuera de una carpeta por ahora.
        </p>

        <div className={styles.folderChoiceList}>
          <button
            type="button"
            className={`${styles.folderChoiceCard} ${selectedFolderId === null ? styles.folderChoiceCardActive : ""}`}
            onClick={() => setSelectedFolderId(null)}
          >
            <span className={styles.folderChoiceIcon}>
              <i className="fa-regular fa-bookmark" aria-hidden="true" />
            </span>
            <span className={styles.folderChoiceText}>
              <strong>Solo guardarlo</strong>
              <small>Queda en favoritos sin carpeta.</small>
            </span>
          </button>

          {folders.length > 0 ? (
            folders.map((folder) => {
              const isActive = selectedFolderId === folder.id;

              return (
                <button
                  key={folder.id}
                  type="button"
                  className={`${styles.folderChoiceCard} ${isActive ? styles.folderChoiceCardActive : ""}`}
                  onClick={() => setSelectedFolderId(folder.id)}
                >
                  <span className={styles.folderChoiceIcon} style={{ backgroundColor: folder.color }}>
                    <i className="fa-solid fa-folder" aria-hidden="true" />
                  </span>
                  <span className={styles.folderChoiceText}>
                    <strong>{folder.name}</strong>
                    <small>{folder.parkingIds.length} parqueos guardados</small>
                  </span>
                </button>
              );
            })
          ) : (
            <div className={styles.folderChoiceEmpty}>
              Todavía no tienes carpetas creadas. Puedes guardarlo solo por ahora o crear una carpeta
              desde la biblioteca.
            </div>
          )}
        </div>

        {selectedFolder ? (
          <p className={styles.modalSelectionSummary}>
            Se guardará en <strong>{selectedFolder.name}</strong>.
          </p>
        ) : (
          <p className={styles.modalSelectionSummary}>
            Se guardará como <strong>favorito sin carpeta</strong>.
          </p>
        )}

        <div className={styles.modalActions}>
          <button type="button" className={styles.modalSecondaryAction} onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className={styles.modalPrimaryAction} onClick={() => onConfirm(selectedFolderId)}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
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
