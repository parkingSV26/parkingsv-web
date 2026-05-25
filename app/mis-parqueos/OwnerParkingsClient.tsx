"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Parking } from "@/app/parqueos/parking-data";
import styles from "./mis-parqueos.module.css";

type OwnerParkingsClientProps = {
  parkings: Parking[];
};

type EditParkingDraft = {
  address: string;
  businessName: string;
  department: string;
  description: string;
  is24_7: boolean;
  mainPrice: string;
  municipality: string;
  name: string;
  reference: string;
  reservableSpaces: string;
};

export default function OwnerParkingsClient({ parkings }: OwnerParkingsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [parkingItems, setParkingItems] = useState(parkings);
  const [editingParkingId, setEditingParkingId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditParkingDraft | null>(null);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setNotice(null);
    }, 2800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [notice]);

  const filteredParkings = useMemo(() => {
    const normalizedQuery = normalizeText(searchQuery);

    if (!normalizedQuery) {
      return parkingItems;
    }

    return parkingItems.filter((parking) =>
      normalizeText(`${parking.name} ${parking.department} ${parking.municipality}`).includes(
        normalizedQuery,
      ),
    );
  }, [parkingItems, searchQuery]);

  const editingParking =
    editingParkingId ? parkingItems.find((parking) => parking.id === editingParkingId) ?? null : null;
  const deleteTarget =
    deleteTargetId ? parkingItems.find((parking) => parking.id === deleteTargetId) ?? null : null;

  function openEditModal(parking: Parking) {
    setEditingParkingId(parking.id);
    setEditDraft(createEditDraft(parking));
  }

  function closeEditModal() {
    setEditingParkingId(null);
    setEditDraft(null);
  }

  function saveEditedParking() {
    if (!editingParkingId || !editDraft) {
      return;
    }

    setParkingItems((current) =>
      current.map((parking) => {
        if (parking.id !== editingParkingId) {
          return parking;
        }

        const reservableSpaces = Math.max(0, Number(editDraft.reservableSpaces) || 0);
        const department = editDraft.department.trim() || parking.department;
        const municipality = editDraft.municipality.trim() || parking.municipality;
        const address = editDraft.address.trim() || parking.address;
        const reference = editDraft.reference.trim() || parking.reference;

        return {
          ...parking,
          name: editDraft.name.trim() || parking.name,
          businessName: editDraft.businessName.trim() || parking.businessName,
          department,
          municipality,
          address,
          reference,
          mainPrice: editDraft.mainPrice.trim() || parking.mainPrice,
          reservableSpaces,
          description: editDraft.description.trim() || parking.description,
          is24_7: editDraft.is24_7,
          capacitySummary: {
            ...parking.capacitySummary,
            reservable: reservableSpaces,
          },
          location: {
            ...parking.location,
            municipality,
            streetAddress: address,
            reference,
          },
        };
      }),
    );

    closeEditModal();
    setNotice("Cambios guardados correctamente.");
  }

  function deleteParking() {
    if (!deleteTargetId) {
      return;
    }

    setParkingItems((current) => current.filter((parking) => parking.id !== deleteTargetId));
    setDeleteTargetId(null);
    setNotice("Parqueo retirado de la lista actual.");
  }

  return (
    <section className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Panel propietario</p>
            <h1 className={styles.pageHeader}>
              Parqueos que das a <span>conocer</span>
            </h1>
            <p className={styles.heroText}>
              Administra tus publicaciones, revisa su estado actual y actualiza su informacion
              desde un panel centralizado.
            </p>
          </div>

          <div className={styles.summaryCard}>
            <strong>{parkingItems.length}</strong>
            <span>publicacion(es) activas</span>
            <small>{filteredParkings.length} visible(s) con el filtro actual</small>
          </div>
        </div>

        <div className={styles.searchContainer}>
          <div className={styles.searchBar}>
            <i className="fas fa-search" aria-hidden="true" />
            <input
              type="text"
              placeholder="Buscar parqueo..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </div>

        <div className={styles.grid}>
          {filteredParkings.length > 0 ? (
            filteredParkings.map((parking) => (
              <article key={parking.id} className={styles.card}>
                <Link href={`/parqueos/${parking.id}`} className={styles.cardLink}>
                  <div className={styles.cardImageWrap}>
                    <Image
                      src={parking.image}
                      alt={parking.name}
                      className={styles.cardImage}
                      width={720}
                      height={420}
                    />
                    <span className={styles.demoBadge}>Editable</span>
                  </div>
                </Link>

                <div className={styles.cardContent}>
                  <div className={styles.cardTopRow}>
                    <div>
                      <h3>{parking.name}</h3>
                      <p className={styles.businessName}>{parking.businessName}</p>
                    </div>
                    <span className={styles.priceTag}>{parking.mainPrice}</span>
                  </div>

                  <div className={styles.location}>
                    {formatParkingLocation(parking.department, parking.municipality)}
                  </div>
                  <p className={styles.description}>{parking.description}</p>

                  <div className={styles.metaRow}>
                    <span>
                      <i className="fa-solid fa-car-side" aria-hidden="true" />{" "}
                      {parking.capacitySummary.general} espacios
                    </span>
                    <span>
                      <i className="fa-solid fa-calendar-check" aria-hidden="true" />{" "}
                      {parking.reservableSpaces} reservables
                    </span>
                    <span>
                      <i className="fa-solid fa-clock" aria-hidden="true" />{" "}
                      {parking.is24_7 ? "24/7" : "Horario por tramos"}
                    </span>
                  </div>

                  <div className={styles.cardActions}>
                    <Link href={`/parqueos/${parking.id}`} className={styles.viewButton}>
                      <i className="fa-solid fa-eye" aria-hidden="true" />
                      <span>Ver</span>
                    </Link>
                    <Link
                      href={`/mis-parqueos/${parking.id}/reservas`}
                      className={styles.inspectReservationsButton}
                    >
                      <i className="fa-solid fa-calendar-check" aria-hidden="true" />
                      <span>Inspeccionar reservas</span>
                    </Link>
                    <button
                      type="button"
                      className={styles.editButton}
                      onClick={() => openEditModal(parking)}
                    >
                      <i className="fa-solid fa-pen-to-square" aria-hidden="true" />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={() => setDeleteTargetId(parking.id)}
                    >
                      <i className="fa-solid fa-trash-can" aria-hidden="true" />
                      <span>Borrar</span>
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIllustration}>
                <Image
                  src="/parkingsv/parking-lot.png"
                  alt="Sin parqueos publicados"
                  width={180}
                  height={140}
                />
              </div>
              <h3>Aun no tienes parqueos visibles</h3>
              <p>
                Ajusta los filtros o publica un nuevo espacio para seguir ampliando tu inventario.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className={styles.floatingAdder}>
        <Link href="/publicar-parqueo" className={styles.floatingButton} title="Publicar parqueo">
          <i className="fas fa-plus" aria-hidden="true" />
        </Link>
      </div>

      {notice ? <div className={styles.notice}>{notice}</div> : null}

      {editingParking && editDraft ? (
        <div className={styles.modalBackdrop} onClick={closeEditModal}>
          <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.modalEyebrow}>Edicion</p>
                <h2>Editar {editingParking.name}</h2>
              </div>
              <button
                type="button"
                className={styles.modalClose}
                onClick={closeEditModal}
                aria-label="Cerrar modal"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>

            <p className={styles.modalHint}>
              Actualiza la informacion principal del parqueo desde este formulario.
            </p>

            <div className={styles.modalGrid}>
              <label className={styles.field}>
                <span>Nombre del parqueo</span>
                <input
                  value={editDraft.name}
                  onChange={(event) =>
                    setEditDraft((current) =>
                      current
                        ? {
                            ...current,
                            name: event.target.value,
                          }
                        : current,
                    )
                  }
                />
              </label>

              <label className={styles.field}>
                <span>Nombre del negocio</span>
                <input
                  value={editDraft.businessName}
                  onChange={(event) =>
                    setEditDraft((current) =>
                      current
                        ? {
                            ...current,
                            businessName: event.target.value,
                          }
                        : current,
                    )
                  }
                />
              </label>

              <label className={styles.field}>
                <span>Departamento</span>
                <input
                  value={editDraft.department}
                  onChange={(event) =>
                    setEditDraft((current) =>
                      current
                        ? {
                            ...current,
                            department: event.target.value,
                          }
                        : current,
                    )
                  }
                />
              </label>

              <label className={styles.field}>
                <span>Municipio</span>
                <input
                  value={editDraft.municipality}
                  onChange={(event) =>
                    setEditDraft((current) =>
                      current
                        ? {
                            ...current,
                            municipality: event.target.value,
                          }
                        : current,
                    )
                  }
                />
              </label>

              <label className={styles.field}>
                <span>Direccion</span>
                <input
                  value={editDraft.address}
                  onChange={(event) =>
                    setEditDraft((current) =>
                      current
                        ? {
                            ...current,
                            address: event.target.value,
                          }
                        : current,
                    )
                  }
                />
              </label>

              <label className={styles.field}>
                <span>Referencia</span>
                <input
                  value={editDraft.reference}
                  onChange={(event) =>
                    setEditDraft((current) =>
                      current
                        ? {
                            ...current,
                            reference: event.target.value,
                          }
                        : current,
                    )
                  }
                />
              </label>

              <label className={styles.field}>
                <span>Tarifa principal</span>
                <input
                  value={editDraft.mainPrice}
                  onChange={(event) =>
                    setEditDraft((current) =>
                      current
                        ? {
                            ...current,
                            mainPrice: event.target.value,
                          }
                        : current,
                    )
                  }
                />
              </label>

              <label className={styles.field}>
                <span>Espacios reservables</span>
                <input
                  type="number"
                  min="0"
                  value={editDraft.reservableSpaces}
                  onChange={(event) =>
                    setEditDraft((current) =>
                      current
                        ? {
                            ...current,
                            reservableSpaces: event.target.value,
                          }
                        : current,
                    )
                  }
                />
              </label>

              <label className={`${styles.field} ${styles.fieldWide}`}>
                <span>Descripcion</span>
                <textarea
                  value={editDraft.description}
                  onChange={(event) =>
                    setEditDraft((current) =>
                      current
                        ? {
                            ...current,
                            description: event.target.value,
                          }
                        : current,
                    )
                  }
                />
              </label>

              <label className={`${styles.field} ${styles.checkboxField}`}>
                <input
                  type="checkbox"
                  checked={editDraft.is24_7}
                  onChange={(event) =>
                    setEditDraft((current) =>
                      current
                        ? {
                            ...current,
                            is24_7: event.target.checked,
                          }
                        : current,
                    )
                  }
                />
                <span>Mostrar como abierto 24/7</span>
              </label>
            </div>

            <div className={styles.modalActions}>
              <button type="button" className={styles.modalGhostButton} onClick={closeEditModal}>
                Cancelar
              </button>
              <button type="button" className={styles.modalPrimaryButton} onClick={saveEditedParking}>
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className={styles.modalBackdrop} onClick={() => setDeleteTargetId(null)}>
          <div className={styles.confirmCard} onClick={(event) => event.stopPropagation()}>
            <p className={styles.modalEyebrow}>Borrado</p>
            <h2>Quitar {deleteTarget.name} de esta vista</h2>
            <p className={styles.confirmText}>
              Confirma si deseas retirar este parqueo de la lista actual.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalGhostButton}
                onClick={() => setDeleteTargetId(null)}
              >
                Mantener parqueo
              </button>
              <button type="button" className={styles.modalDangerButton} onClick={deleteParking}>
                Quitar parqueo
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function createEditDraft(parking: Parking): EditParkingDraft {
  return {
    address: parking.address,
    businessName: parking.businessName,
    department: parking.department,
    description: parking.description,
    is24_7: parking.is24_7,
    mainPrice: parking.mainPrice,
    municipality: parking.municipality,
    name: parking.name,
    reference: parking.reference,
    reservableSpaces: String(parking.reservableSpaces),
  };
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
