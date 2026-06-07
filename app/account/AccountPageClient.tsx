/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { logoutAction } from "@/app/lib/auth/actions";
import type { AccountPageData, AccountSpecification, AccountVehicle, VehicleOption } from "@/app/lib/account";
import styles from "@/app/account/account.module.css";

type ModalName = "logout" | "pfp" | "profile" | "specs" | "vehicles" | null;

type NotificationState = {
  message: string;
  type: "error" | "success";
} | null;

type SpecDraft = {
  description: string;
  hasValue: boolean;
  icon: string;
  id: number;
  isActive: boolean;
  name: string;
  value: string;
  valueLabel: string | null;
};

type ProfileDraft = {
  dateOfBirth: string;
  email: string;
  fullName: string;
  phoneNumber: string;
};

type AccountPageClientProps = {
  data: AccountPageData;
};

const deprecatedIconMap: Record<string, string> = {
  "car-alt": "car-rear",
};

function normalizeIconName(icon: string) {
  return deprecatedIconMap[icon] ?? icon;
}

function createSpecDrafts(specifications: AccountSpecification[]): SpecDraft[] {
  return specifications.map((specification) => ({
    ...specification,
    value: specification.value ?? "",
  }));
}

function createProfileDraft(user: AccountPageData["user"]): ProfileDraft {
  return {
    dateOfBirth: normalizeDateInput(user.dateOfBirth),
    email: user.email,
    fullName: user.fullName,
    phoneNumber: user.phoneNumber ?? "",
  };
}

function normalizeDateInput(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value.trim().slice(0, 10);
}

function formatProfileDate(value: string | null | undefined) {
  const normalized = normalizeDateInput(value);

  if (!normalized) {
    return "No registrada";
  }

  const [year, month, day] = normalized.split("-");

  if (!year || !month || !day) {
    return normalized;
  }

  return `${day}/${month}/${year}`;
}

function renderSpecificationValue(specification: AccountSpecification | SpecDraft) {
  if (specification.hasValue && specification.value.trim()) {
    return `${specification.value}${specification.valueLabel ? ` ${specification.valueLabel}` : ""}`;
  }

  return specification.name;
}

export default function AccountPageClient({ data }: AccountPageClientProps) {
  const [userProfile, setUserProfile] = useState(data.user);
  const [profilePicture, setProfilePicture] = useState(data.user.profilePicture);
  const [userVehicles, setUserVehicles] = useState<AccountVehicle[]>(data.userVehicles);
  const [locationText, setLocationText] = useState(data.locationText);
  const [specifications, setSpecifications] = useState<AccountSpecification[]>(data.specifications);
  const [activeModal, setActiveModal] = useState<ModalName>(null);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<number[]>(
    data.userVehicles.map((vehicle) => vehicle.id),
  );
  const [specDrafts, setSpecDrafts] = useState<SpecDraft[]>(() => createSpecDrafts(data.specifications));
  const [notification, setNotification] = useState<NotificationState>(null);
  const [isSavingVehicles, setIsSavingVehicles] = useState(false);
  const [isSavingSpecs, setIsSavingSpecs] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingProfilePicture, setIsSavingProfilePicture] = useState(false);
  const [profileStep, setProfileStep] = useState<"camera" | "options" | "preview">("options");
  const [profilePreviewSrc, setProfilePreviewSrc] = useState("");
  const [selectedProfileFile, setSelectedProfileFile] = useState<File | null>(null);
  const [isCameraBusy, setIsCameraBusy] = useState(false);
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>(() => createProfileDraft(data.user));

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const notificationTimeoutRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const activeSpecifications = useMemo(
    () => specifications.filter((specification) => specification.isActive),
    [specifications],
  );

  useEffect(() => {
    document.body.style.overflow = activeModal ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [activeModal]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeAllModals();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  });

  useEffect(() => {
    return () => {
      stopCamera();

      if (notificationTimeoutRef.current !== null) {
        window.clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  function showNotification(message: string, type: "error" | "success") {
    setNotification({ message, type });

    if (notificationTimeoutRef.current !== null) {
      window.clearTimeout(notificationTimeoutRef.current);
    }

    notificationTimeoutRef.current = window.setTimeout(() => {
      setNotification(null);
      notificationTimeoutRef.current = null;
    }, 3000);
  }

  function openModal(modalName: ModalName) {
    if (modalName === "vehicles") {
      setSelectedVehicleIds(userVehicles.map((vehicle) => vehicle.id));
    }

    if (modalName === "profile") {
      setProfileDraft(createProfileDraft(userProfile));
    }

    if (modalName === "specs") {
      setSpecDrafts(createSpecDrafts(specifications));
    }

    if (modalName === "pfp") {
      resetProfilePictureModal();
    }

    setActiveModal(modalName);
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsCameraBusy(false);
  }

  function resetProfilePictureModal() {
    stopCamera();
    setProfileStep("options");
    setProfilePreviewSrc("");
    setSelectedProfileFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function closeAllModals() {
    setActiveModal(null);
    resetProfilePictureModal();
  }

  async function startCamera() {
    stopCamera();

    if (!navigator.mediaDevices?.getUserMedia) {
      showNotification("Tu navegador no soporta acceso a la cámara.", "error");
      return;
    }

    try {
      setIsCameraBusy(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
        },
      });

      streamRef.current = stream;
      setProfileStep("camera");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error(error);
      showNotification("No se pudo acceder a la cámara. Verifica los permisos.", "error");
      setProfileStep("options");
      setIsCameraBusy(false);
    }
  }

  async function handleProfileFileSelection(file: File) {
    const validTypes = ["image/gif", "image/jpeg", "image/png"];

    if (!validTypes.includes(file.type)) {
      showNotification("Solo se permiten imagenes JPEG, PNG o GIF.", "error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showNotification("La imagen debe ser menor a 2MB.", "error");
      return;
    }

    stopCamera();
    setSelectedProfileFile(file);
    setProfilePreviewSrc(URL.createObjectURL(file));
    setProfileStep("preview");
  }

  async function capturePhoto() {
    const videoElement = videoRef.current;

    if (!videoElement || !videoElement.videoWidth || !videoElement.videoHeight) {
      showNotification("No se pudo capturar la foto desde la cámara.", "error");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      showNotification("No se pudo procesar la captura de la cámara.", "error");
      return;
    }

    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.92);
    });

    if (!blob) {
      showNotification("No se pudo generar la imagen capturada.", "error");
      return;
    }

    const file = new File([blob], "profile-picture.jpg", {
      type: "image/jpeg",
    });

    await handleProfileFileSelection(file);
  }

  async function saveProfilePicture() {
    if (!selectedProfileFile) {
      showNotification("Selecciona una imagen antes de guardar.", "error");
      return;
    }

    try {
      setIsSavingProfilePicture(true);
      const formData = new FormData();
      formData.set("profile_picture", selectedProfileFile);

      const response = await fetch("/api/account/profile-picture", {
        body: formData,
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string; newPath?: string };

      if (!response.ok || !payload.newPath) {
        throw new Error(payload.error ?? "Error al guardar la foto de perfil.");
      }

      setProfilePicture(payload.newPath);
      window.dispatchEvent(
        new CustomEvent("parking-sv-profile-picture-updated", {
          detail: {
            url: payload.newPath,
          },
        }),
      );
      showNotification("Foto de perfil actualizada correctamente.", "success");
      closeAllModals();
    } catch (error) {
      console.error(error);
      showNotification(
        error instanceof Error ? error.message : "Error al guardar la foto de perfil.",
        "error",
      );
    } finally {
      setIsSavingProfilePicture(false);
    }
  }

  function updateProfileDraft<K extends keyof ProfileDraft>(field: K, value: ProfileDraft[K]) {
    setProfileDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveProfile() {
    try {
      setIsSavingProfile(true);
      const response = await fetch("/api/account/profile", {
        body: JSON.stringify({
          dateOfBirth: profileDraft.dateOfBirth,
          email: profileDraft.email,
          fullName: profileDraft.fullName,
          phoneNumber: profileDraft.phoneNumber,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as {
        error?: string;
        user?: {
          dateOfBirth: string | null;
          email: string;
          fullName: string;
          phoneNumber: string | null;
        };
      };

      if (!response.ok || !payload.user) {
        throw new Error(payload.error ?? "Error al actualizar el perfil.");
      }

      setUserProfile((current) => ({
        ...current,
        dateOfBirth: payload.user?.dateOfBirth ?? null,
        email: payload.user?.email ?? current.email,
        fullName: payload.user?.fullName ?? current.fullName,
        phoneNumber: payload.user?.phoneNumber ?? null,
      }));
      showNotification("Perfil actualizado correctamente.", "success");
      setActiveModal(null);
    } catch (error) {
      console.error(error);
      showNotification(
        error instanceof Error ? error.message : "Error al actualizar el perfil.",
        "error",
      );
    } finally {
      setIsSavingProfile(false);
    }
  }

  function toggleVehicle(vehicleId: number) {
    setSelectedVehicleIds((current) =>
      current.includes(vehicleId)
        ? current.filter((id) => id !== vehicleId)
        : [...current, vehicleId].sort((left, right) => left - right),
    );
  }

  async function saveVehicles() {
    try {
      setIsSavingVehicles(true);
      const response = await fetch("/api/account/vehicles", {
        body: JSON.stringify({
          vehicles: selectedVehicleIds,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as {
        error?: string;
        vehicles?: AccountVehicle[];
      };

      if (!response.ok || !payload.vehicles) {
        throw new Error(payload.error ?? "Error al actualizar los vehiculos.");
      }

      setUserVehicles(payload.vehicles);
      showNotification("Vehiculos actualizados correctamente.", "success");
      setActiveModal(null);
    } catch (error) {
      console.error(error);
      showNotification(
        error instanceof Error ? error.message : "Error al actualizar los vehículos.",
        "error",
      );
    } finally {
      setIsSavingVehicles(false);
    }
  }

  async function updateLocation() {
    if (!navigator.geolocation) {
      showNotification("Tu navegador no soporta geolocalizacion.", "error");
      return;
    }

    try {
      setIsSavingLocation(true);

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const response = await fetch("/api/account/location", {
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string; locationText?: string };

      if (!response.ok || !payload.locationText) {
        throw new Error(payload.error ?? "Error al actualizar la ubicacion.");
      }

      setLocationText(payload.locationText);
      showNotification("Ubicacion actualizada correctamente.", "success");
    } catch (error) {
      console.error(error);

      if (error instanceof GeolocationPositionError) {
        const messages = {
          1: "Permiso denegado para acceder a tu ubicación.",
          2: "La ubicación no esta disponible en este momento.",
          3: "Se agotó el tiempo para obtener tu ubicación.",
        } as const;

        showNotification(messages[error.code as 1 | 2 | 3] ?? error.message, "error");
      } else {
        showNotification(
          error instanceof Error ? error.message : "Error al actualizar la ubicación.",
          "error",
        );
      }
    } finally {
      setIsSavingLocation(false);
    }
  }

  function toggleSpecification(specificationId: number, isActive: boolean) {
    setSpecDrafts((current) =>
      current.map((specification) => {
        if (specification.id !== specificationId) {
          return specification;
        }

        return {
          ...specification,
          isActive,
          value: isActive ? specification.value : "",
        };
      }),
    );
  }

  function updateSpecificationValue(specificationId: number, value: string) {
    setSpecDrafts((current) =>
      current.map((specification) =>
        specification.id === specificationId
          ? {
              ...specification,
              value,
            }
          : specification,
      ),
    );
  }

  async function saveSpecifications() {
    try {
      setIsSavingSpecs(true);
      const response = await fetch("/api/account/specifications", {
        body: JSON.stringify({
          specifications: specDrafts
            .filter((specification) => specification.isActive)
            .map((specification) => ({
              id: specification.id,
              value: specification.hasValue ? specification.value.trim() : "",
            })),
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as {
        error?: string;
        specifications?: AccountSpecification[];
      };

      if (!response.ok || !payload.specifications) {
        throw new Error(payload.error ?? "Error al guardar las especificaciones.");
      }

      setSpecifications(payload.specifications);
      showNotification("Especificaciones actualizadas correctamente.", "success");
      setActiveModal(null);
    } catch (error) {
      console.error(error);
      showNotification(
        error instanceof Error ? error.message : "Error al guardar las especificaciones.",
        "error",
      );
    } finally {
      setIsSavingSpecs(false);
    }
  }

  return (
    <div className={styles.accountContainer}>
      <header className={styles.accountHeader}>
        <h1>Información sobre mi cuenta</h1>
      </header>

      <section className={styles.personalCard}>
        <div className={styles.cardHeaderRow}>
          <h2 className={styles.cardTitle}>Personal</h2>
          <button type="button" className={styles.btnEditProfile} onClick={() => openModal("profile")}>
            <i className="fa-solid fa-pen-to-square" aria-hidden="true" />
            <span>Editar perfil</span>
          </button>
        </div>
        <div className={styles.personalContent}>
          <div className={styles.profilePictureContainer}>
            <img src={profilePicture} alt="Foto de perfil" className={styles.profilePicture} />
            <button type="button" className={styles.editPfpBtn} onClick={() => openModal("pfp")}>
              <i className="fa-solid fa-camera" aria-hidden="true" />
            </button>
          </div>

          <div className={styles.personalInfo}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Nombre completo:</span>
              <span className={styles.infoValue}>{userProfile.fullName}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Número de teléfono:</span>
              <span className={styles.infoValue}>{userProfile.phoneNumber ?? "No registrado"}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Fecha de nacimiento:</span>
              <span className={styles.infoValue}>{formatProfileDate(userProfile.dateOfBirth)}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Correo electrónico:</span>
              <span className={styles.infoValue}>{userProfile.email}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Tipo de usuario:</span>
              <span className={styles.infoValue}>
                {userProfile.userType === "owner" ? "Propietario" : "Cliente"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.transportCard}>
        <h2 className={styles.cardTitleAlt}>Transporte y ubicación</h2>
        <div className={styles.vehiclesSection}>
          <div className={styles.vehiclesHeader}>
            <h3>Actualmente conduces:</h3>
            <button type="button" className={styles.btnEditVehicles} onClick={() => openModal("vehicles")}>
              <i className="fa-solid fa-pen-to-square" aria-hidden="true" /> Editar
            </button>
          </div>

          <div className={styles.vehiclesList}>
            {userVehicles.length === 0 ? (
              <div className={styles.noVehicles}>
                <i className="fa-solid fa-circle-info" aria-hidden="true" />
                No has seleccionado ningún vehículo
              </div>
            ) : (
              <ul>
                {userVehicles.map((vehicle) => (
                  <li key={vehicle.id} className={styles.vehicleItem}>
                    <i className={`fa-solid fa-${normalizeIconName(vehicle.icon)}`} aria-hidden="true" />
                    {vehicle.categoryName}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className={styles.locationSection}>
          <h3>Tu ubicación:</h3>
          <p className={styles.locationText}>{locationText}</p>
          <button
            type="button"
            className={styles.btnUpdateLocation}
            onClick={() => void updateLocation()}
            disabled={isSavingLocation}
          >
            <i className="fa-solid fa-location-dot" aria-hidden="true" />{" "}
            {isSavingLocation ? "Actualizando..." : "Actualizar ubicación"}
          </button>
        </div>
      </section>

      <section className={styles.specsCard}>
        <h2 className={styles.cardTitleAlt}>Mis especificaciones</h2>
        <div className={styles.specsContent}>
          <div className={styles.specsHeader}>
            <h3>Caracteristicas y preferencias:</h3>
            <button type="button" className={styles.btnEditSpecs} onClick={() => openModal("specs")}>
              <i className="fa-solid fa-pen-to-square" aria-hidden="true" /> Editar
            </button>
          </div>

          <div className={styles.specsList}>
            {activeSpecifications.length === 0 ? (
              <div className={styles.noSpecs}>
                <i className="fa-solid fa-circle-info" aria-hidden="true" />
                No has configurado tus especificaciones aún
              </div>
            ) : (
              <ul>
                {activeSpecifications.map((specification) => (
                  <li key={specification.id} className={styles.specItem}>
                    <i
                      className={`fa-solid fa-${normalizeIconName(specification.icon)}`}
                      aria-hidden="true"
                    />
                    <span className={styles.specName}>{specification.name}:</span>
                    <span className={styles.specValue}>{renderSpecificationValue(specification)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {userProfile.userType === "owner" ? (
        <section className={styles.ownerActions}>
          <Link href="/mis-parqueos" className={styles.ownerBtn}>
            <i className="fa-solid fa-square-parking" aria-hidden="true" /> Mis parqueos
          </Link>
        </section>
      ) : (
        <section className={styles.ownerActions}>
          <Link href="/mis-reservas" className={styles.ownerBtn}>
            <i className="fa-solid fa-calendar-check" aria-hidden="true" /> Mis reservas
          </Link>
        </section>
      )}

      <button type="button" className={styles.logoutBtn} onClick={() => openModal("logout")}>
        <i className="fa-solid fa-right-from-bracket" aria-hidden="true" /> Cerrar sesión
      </button>

      <div
        className={`${styles.modal} ${activeModal === "vehicles" ? styles.show : ""}`}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeAllModals();
          }
        }}
      >
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <h3>Selecciona los vehículos que manejas</h3>
            <button type="button" className={styles.closeModal} onClick={closeAllModals}>
              &times;
            </button>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.vehicleOptionsGrid}>
              {data.allVehicleTypes.map((vehicle: VehicleOption) => {
                const checked = selectedVehicleIds.includes(vehicle.id);

                return (
                  <div key={vehicle.id} className={styles.vehicleOptionCard}>
                    <input
                      id={`vehicle-${vehicle.id}`}
                      type="checkbox"
                      className={styles.vehicleCheckbox}
                      checked={checked}
                      onChange={() => toggleVehicle(vehicle.id)}
                    />
                    <label htmlFor={`vehicle-${vehicle.id}`} className={styles.vehicleLabel}>
                      <div className={styles.vehicleIcon}>
                        <i className={`fa-solid fa-${normalizeIconName(vehicle.icon)}`} aria-hidden="true" />
                      </div>
                      <div className={styles.vehicleInfo}>
                        <span className={styles.vehicleName}>{vehicle.categoryName}</span>
                        <p className={styles.vehicleDescription}>{vehicle.description}</p>
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnCancel} onClick={closeAllModals}>
              Cancelar
            </button>
            <button
              type="button"
              className={styles.btnSaveVehicles}
              onClick={() => void saveVehicles()}
              disabled={isSavingVehicles}
            >
              {isSavingVehicles ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`${styles.modal} ${activeModal === "specs" ? styles.show : ""}`}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeAllModals();
          }
        }}
      >
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <h3>Configura tus especificaciones</h3>
            <button type="button" className={styles.closeModal} onClick={closeAllModals}>
              &times;
            </button>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.specsOptions}>
              {specDrafts.map((specification) => (
                <div
                  key={specification.id}
                  className={`${styles.specOptionCard} ${
                    specification.isActive ? styles.specOptionActive : ""
                  }`}
                >
                  <div className={styles.specHeaderCard}>
                    <div className={styles.specIcon}>
                      <i
                        className={`fa-solid fa-${normalizeIconName(specification.icon)}`}
                        aria-hidden="true"
                      />
                    </div>
                    <div className={styles.specInfo}>
                      <h4>{specification.name}</h4>
                      <p>{specification.description}</p>
                    </div>
                    <label className={styles.specToggle}>
                      <input
                        type="checkbox"
                        className={styles.specCheckbox}
                        checked={specification.isActive}
                        onChange={(event) =>
                          toggleSpecification(specification.id, event.currentTarget.checked)
                        }
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>

                  {specification.hasValue && specification.isActive ? (
                    <div className={styles.specValueInput}>
                      <input
                        type="text"
                        className={styles.specInput}
                        placeholder={specification.valueLabel ?? "Valor"}
                        value={specification.value}
                        onChange={(event) =>
                          updateSpecificationValue(specification.id, event.currentTarget.value)
                        }
                      />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnCancel} onClick={closeAllModals}>
              Cancelar
            </button>
            <button
              type="button"
              className={styles.btnSaveSpecs}
              onClick={() => void saveSpecifications()}
              disabled={isSavingSpecs}
            >
              {isSavingSpecs ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`${styles.modal} ${activeModal === "pfp" ? styles.show : ""}`}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeAllModals();
          }
        }}
      >
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <h3>Cambiar foto de perfil</h3>
            <button type="button" className={styles.closeModal} onClick={closeAllModals}>
              &times;
            </button>
          </div>
          <div className={styles.modalBody}>
            {profileStep === "options" ? (
              <div className={styles.pfpOptions}>
                <button
                  type="button"
                  className={styles.pfpOption}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <i className="fa-solid fa-upload" aria-hidden="true" />
                  <span>Subir una foto</span>
                </button>
                <button type="button" className={styles.pfpOption} onClick={() => void startCamera()}>
                  <i className="fa-solid fa-camera" aria-hidden="true" />
                  <span>{isCameraBusy ? "Abriendo cámara..." : "Tomar una foto"}</span>
                </button>
              </div>
            ) : null}

            {profileStep === "camera" ? (
              <div className={styles.cameraPreview}>
                <video ref={videoRef} className={styles.cameraFeed} autoPlay playsInline />
                <button type="button" className={styles.btnCapture} onClick={() => void capturePhoto()} />
              </div>
            ) : null}

            {profileStep === "preview" ? (
              <div className={styles.imagePreview}>
                <img src={profilePreviewSrc} alt="Vista previa" className={styles.previewImg} />
                <div className={styles.previewActions}>
                  <button type="button" className={styles.btnRetake} onClick={resetProfilePictureModal}>
                    Volver
                  </button>
                  <button
                    type="button"
                    className={styles.btnConfirm}
                    onClick={() => void saveProfilePicture()}
                    disabled={isSavingProfilePicture}
                  >
                    {isSavingProfilePicture ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>
            ) : null}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif"
              hidden
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];

                if (file) {
                  void handleProfileFileSelection(file);
                }
              }}
            />
          </div>
        </div>
      </div>

      <div
        className={`${styles.modal} ${activeModal === "profile" ? styles.show : ""}`}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeAllModals();
          }
        }}
      >
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <h3>
              <i className="fa-solid fa-user-pen" aria-hidden="true" /> Editar perfil
            </h3>
            <button type="button" className={styles.closeModal} onClick={closeAllModals}>
              &times;
            </button>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.profileGrid}>
              <label className={styles.profileField}>
                <span>Nombre completo</span>
                <input
                  type="text"
                  value={profileDraft.fullName}
                  onChange={(event) => updateProfileDraft("fullName", event.currentTarget.value)}
                />
              </label>

              <label className={styles.profileField}>
                <span>Correo electrónico</span>
                <input
                  type="email"
                  value={profileDraft.email}
                  onChange={(event) => updateProfileDraft("email", event.currentTarget.value)}
                />
              </label>

              <label className={styles.profileField}>
                <span>Número de teléfono</span>
                <input
                  type="tel"
                  value={profileDraft.phoneNumber}
                  onChange={(event) => updateProfileDraft("phoneNumber", event.currentTarget.value)}
                />
              </label>

              <label className={styles.profileField}>
                <span>Fecha de nacimiento</span>
                <input
                  type="date"
                  value={profileDraft.dateOfBirth}
                  onChange={(event) => updateProfileDraft("dateOfBirth", event.currentTarget.value)}
                />
              </label>
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnCancel} onClick={closeAllModals}>
              Cancelar
            </button>
            <button
              type="button"
              className={styles.btnSaveProfile}
              onClick={() => void saveProfile()}
              disabled={isSavingProfile}
            >
              {isSavingProfile ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`${styles.modal} ${activeModal === "logout" ? styles.show : ""}`}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeAllModals();
          }
        }}
      >
        <div className={`${styles.modalContent} ${styles.logoutModalContent}`}>
          <div className={styles.modalHeader}>
            <h3>
              <i className="fa-solid fa-right-from-bracket" aria-hidden="true" /> Cerrar sesión
            </h3>
            <button type="button" className={styles.closeModal} onClick={closeAllModals}>
              &times;
            </button>
          </div>
          <div className={`${styles.modalBody} ${styles.logoutModalBody}`}>
            <p>¿Estás seguro que deseas cerrar tu sesión?</p>
            <div className={styles.logoutIcons}>
              <i className="fa-solid fa-door-open" aria-hidden="true" />
              <i className="fa-solid fa-user" aria-hidden="true" />
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnCancel} onClick={closeAllModals}>
              Cancelar
            </button>
            <form action={logoutAction}>
              <button type="submit" className={styles.btnLogout}>
                Sí, cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </div>

      {notification ? (
        <div
          className={`${styles.notification} ${
            notification.type === "success" ? styles.notificationSuccess : styles.notificationError
          }`}
        >
          {notification.message}
        </div>
      ) : null}
    </div>
  );
}
