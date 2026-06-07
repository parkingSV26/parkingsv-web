/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  startTransition,
  type ChangeEvent,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  PublishParkingCatalog,
  PublishParkingCategory,
  PublishParkingRestriction,
  PublishParkingService,
  PublishParkingVehicleType,
} from "./_lib/publish-parking-types";
import type { Parking, ParkingDayKey } from "@/app/parkings/parking-data";
import { publishParkingAction } from "./actions";
import { initialPublishParkingState } from "./publish-parking-state";
import styles from "./publish-parking.module.css";

type PublishParkingClientProps = {
  catalog: PublishParkingCatalog;
  initialParking?: Parking | null;
  mode?: "create" | "edit";
  ownerEmail: string;
  ownerName: string;
  ownerPhone: string;
};

type ModalKey =
  | "capacity"
  | "category"
  | "location"
  | "preview"
  | "rate"
  | "restrictions"
  | "schedule"
  | "services"
  | null;

type DayId =
  | "lunes"
  | "martes"
  | "miercoles"
  | "jueves"
  | "viernes"
  | "sabado"
  | "domingo";

type ScheduleSlotDraft = {
  close: string;
  id: string;
  open: string;
};

type ScheduleDayState = {
  enabled: boolean;
  slots: ScheduleSlotDraft[];
};

type LocationState = {
  address: string;
  department: string;
  googleMapsLink: string;
  municipality: string;
  reference: string;
  wazeLink: string;
};

type RateDraft = {
  appliesTo: string;
  feeType: string;
  isFree: boolean;
  price: string;
  timeUnit: string;
  validFrom: string;
  validTo: string;
  vehicleTypeId: string;
};

type RateItem = RateDraft & {
  id: string;
  vehicleIcon: string;
  vehicleName: string;
};

type ImagePreview = {
  file: File;
  id: string;
  name: string;
  url: string;
};

const departamentos: Record<string, string[]> = {
  "San Salvador Norte": [
    "Aguilares",
    "Apopa",
    "Ayutuxtepeque",
    "Cuscatancingo",
    "Delgado",
    "El Paisnal",
    "Guazapa",
    "Ilopango",
    "Mejicanos",
    "Nejapa",
    "Panchimalco",
    "Rosario de Mora",
    "San Marcos",
    "San Martín",
    "Santiago Texacuangos",
    "Santo Tomás",
    "Soyapango",
    "Tonacatepeque",
  ],
  "San Salvador Oeste": [
    "Antiguo Cuscatlán",
    "Huizúcar",
    "San Juan Opico",
    "Nuevo Cuscatlán",
    "Quezaltepeque",
    "Santa Tecla",
    "Talnique",
  ],
  "San Salvador Este": [
    "Ciudad Arce",
    "Colón",
    "Comasagua",
    "Jayaque",
    "Nahuizalco",
    "Sacacoyo",
    "San José Villanueva",
    "San Pablo Tacachico",
    "Tamanique",
    "Teotepeque",
    "Tepecoyo",
    "Zaragoza",
  ],
  "San Salvador Sur": [
    "Chiltiupán",
    "Jicalapa",
    "La Libertad",
    "Tamanique",
    "Teotepeque",
    "Santa Cruz Michapa",
    "San Juan Opico",
    "Quezaltepeque",
    "Sacacoyo",
    "San Pablo Tacachico",
  ],
  "San Salvador Centro": ["San Salvador Centro"],
};

const dayLabels: Array<{ id: DayId; label: string }> = [
  { id: "lunes", label: "Lunes" },
  { id: "martes", label: "Martes" },
  { id: "miercoles", label: "Miércoles" },
  { id: "jueves", label: "Jueves" },
  { id: "viernes", label: "Viernes" },
  { id: "sabado", label: "Sábado" },
  { id: "domingo", label: "Domingo" },
];

const feeTypeOptions = [
  { icon: "fa-car", label: "Normal", value: "normal" },
  { icon: "fa-crown", label: "Premium", value: "premium" },
  { icon: "fa-moon", label: "Nocturno", value: "nocturno" },
  { icon: "fa-calendar-alt", label: "Mensual", value: "mensual" },
  { icon: "fa-briefcase", label: "Comercial", value: "comercial" },
  { icon: "fa-star", label: "Evento", value: "evento" },
];

const timeUnitOptions = [
  { icon: "fa-stopwatch", label: "Minuto", value: "minuto" },
  { icon: "fa-clock", label: "Hora", value: "hora" },
  { icon: "fa-calendar-day", label: "Día", value: "dia" },
  { icon: "fa-calendar-week", label: "Semana", value: "semana" },
  { icon: "fa-calendar-alt", label: "Mes", value: "mes" },
];

const appliesToOptions = [
  { icon: "fa-briefcase", label: "Días laborales", value: "Días laborales" },
  { icon: "fa-umbrella-beach", label: "Fines de semana", value: "Fines de semana" },
  { icon: "fa-calendar", label: "Toda la semana", value: "Toda la semana" },
];

const defaultSchedule: Record<DayId, ScheduleDayState> = {
  domingo: { enabled: false, slots: [{ close: "17:00", id: "domingo-1", open: "08:00" }] },
  jueves: { enabled: true, slots: [{ close: "20:00", id: "jueves-1", open: "06:00" }] },
  lunes: { enabled: true, slots: [{ close: "20:00", id: "lunes-1", open: "06:00" }] },
  martes: { enabled: true, slots: [{ close: "20:00", id: "martes-1", open: "06:00" }] },
  miercoles: { enabled: true, slots: [{ close: "20:00", id: "miercoles-1", open: "06:00" }] },
  sabado: { enabled: true, slots: [{ close: "21:00", id: "sabado-1", open: "07:00" }] },
  viernes: { enabled: true, slots: [{ close: "21:00", id: "viernes-1", open: "06:00" }] },
};

function PublishParkingSubmitButton({
  pending,
  label,
  pendingLabel,
}: {
  label: string;
  pending: boolean;
  pendingLabel: string;
}) {
  return (
    <button type="submit" className={styles.btnSubmit} disabled={pending}>
      <i className={`fas ${pending ? "fa-spinner fa-spin" : "fa-paper-plane"}`} aria-hidden="true" />
      <span>{pending ? pendingLabel : label}</span>
    </button>
  );
}

export default function PublishParkingClient({
  catalog,
  initialParking,
  mode = "create",
  ownerEmail,
  ownerName,
  ownerPhone,
}: PublishParkingClientProps) {
  const [state, formAction, isPublishing] = useActionState(publishParkingAction, initialPublishParkingState);
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [activeModal, setActiveModal] = useState<ModalKey>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [clearExistingImages, setClearExistingImages] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const firstCategory = catalog.categories[0];
  const firstVehicle = catalog.vehicleTypes[0];
  const isEditMode = mode === "edit";

  const [parkingName, setParkingName] = useState(() => initialParking?.name ?? "");
  const [description, setDescription] = useState(() => initialParking?.description ?? "");
  const [selectedCategoryId, setSelectedCategoryId] = useState(() =>
    resolveInitialCategoryId(catalog.categories, initialParking?.category, firstCategory?.id ?? 1),
  );
  const [location, setLocation] = useState<LocationState>(() =>
    initialParking
      ? {
          address: initialParking.location.streetAddress,
          department: initialParking.department,
          googleMapsLink: initialParking.location.googleMapsLink,
          municipality: initialParking.municipality,
          reference: initialParking.reference,
          wazeLink: initialParking.location.wazeLink,
        }
      : {
          address: "",
          department: "",
          googleMapsLink: "",
          municipality: "",
          reference: "",
          wazeLink: "",
        },
  );
  const [is24_7, setIs24_7] = useState(() => initialParking?.is24_7 ?? false);
  const [schedule, setSchedule] = useState(() => buildInitialSchedule(initialParking));
  const [reservationsEnabled, setReservationsEnabled] = useState(() =>
    initialParking ? initialParking.reservableSpaces > 0 : true,
  );
  const [capacityGeneral, setCapacityGeneral] = useState(() =>
    initialParking ? String(initialParking.capacitySummary.general) : "",
  );
  const [reservableCapacity, setReservableCapacity] = useState(() =>
    initialParking ? String(initialParking.capacitySummary.reservable) : "",
  );
  const [disabledSpaces, setDisabledSpaces] = useState(() =>
    initialParking ? String(initialParking.capacitySummary.disability) : "0",
  );
  const [vehicleCapacities, setVehicleCapacities] = useState<Record<number, string>>(() =>
    buildInitialVehicleCapacities(initialParking),
  );
  const [contactName, setContactName] = useState(() =>
    initialParking?.businessName ?? ownerName,
  );
  const [contactPhone, setContactPhone] = useState(() =>
    initialParking?.contact.phone ?? ownerPhone,
  );
  const [contactEmail, setContactEmail] = useState(() =>
    initialParking?.contact.email ?? ownerEmail,
  );
  const [selectedServices, setSelectedServices] = useState<number[]>(() =>
    buildInitialSelectedServices(catalog.services, initialParking),
  );
  const [selectedRestrictions, setSelectedRestrictions] = useState<number[]>(() =>
    buildInitialSelectedRestrictions(catalog.restrictions, initialParking),
  );
  const [isCovered, setIsCovered] = useState(() =>
    Boolean(initialParking && Number(initialParking.restrictions.physical.maxHeight) > 0),
  );
  const [maxHeight, setMaxHeight] = useState(() =>
    initialParking?.restrictions.physical.maxHeight ?? "",
  );
  const [maxSpeed, setMaxSpeed] = useState(() =>
    initialParking?.restrictions.physical.maxSpeed ?? "",
  );
  const [rateDraft, setRateDraft] = useState<RateDraft>(() =>
    buildInitialRateDraft(catalog.vehicleTypes, initialParking, firstVehicle),
  );
  const [rates, setRates] = useState<RateItem[]>(() =>
    buildInitialRates(catalog.vehicleTypes, initialParking),
  );
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((image) => URL.revokeObjectURL(image.url));
    };
  }, [imagePreviews]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeoutId = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  const selectedCategory =
    catalog.categories.find((category) => category.id === selectedCategoryId) ?? firstCategory;
  const selectedLocationText = formatParkingLocation(location.department, location.municipality);
  const activeDays = dayLabels.filter((day) => schedule[day.id].enabled).length;
  const scheduleSummary = is24_7
    ? "Abierto 24/7"
    : activeDays > 0
      ? `${activeDays} día(s) activos`
      : "No se ha configurado horario";
  const servicesSummary = selectedServices
    .map((id) => catalog.services.find((service) => service.id === id)?.name)
    .filter((value): value is string => Boolean(value));
  const restrictionsSummary = selectedRestrictions
    .map((id) => catalog.restrictions.find((restriction) => restriction.id === id)?.name)
    .filter((value): value is string => Boolean(value));
  const existingParkingImages = initialParking?.images ?? [];
  const coverImage =
    imagePreviews[primaryImageIndex]?.url ?? existingParkingImages[0] ?? "/parkingsv/parking-default.png";
  const previewFee = rates[0];
  const hiddenScheduleJson = useMemo(
    () =>
      JSON.stringify({
        is_24_7: is24_7,
        schedule,
      }),
    [is24_7, schedule],
  );

  function showNotice(message: string) {
    setNotice(message);
  }

  function syncImageInput(files: File[]) {
    const dataTransfer = new DataTransfer();
    files.forEach((file) => dataTransfer.items.add(file));

    if (imageInputRef.current) {
      imageInputRef.current.files = dataTransfer.files;
    }
  }

  function replaceImagePreviews(files: File[]) {
    setImagePreviews((current) => {
      current.forEach((image) => URL.revokeObjectURL(image.url));

      return files.map((file, index) => ({
        file,
        id: `${file.name}-${file.lastModified}-${index}`,
        name: file.name,
        url: URL.createObjectURL(file),
      }));
    });
    setPrimaryImageIndex(0);
    syncImageInput(files);
  }

  function handleImagesSelected(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    const validFiles: File[] = [];

    for (const file of selectedFiles.slice(0, 8)) {
      if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
        showNotice(`El archivo ${file.name} no es una imagen válida.`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        showNotice(`La imagen ${file.name} supera el máximo de 5MB.`);
        continue;
      }

      validFiles.push(file);
    }

    if (selectedFiles.length > 8) {
      showNotice("Solo puedes subir un máximo de 8 imágenes.");
    }

    replaceImagePreviews(validFiles);
  }

  function removeImage(index: number) {
    const nextFiles = imagePreviews.filter((_, currentIndex) => currentIndex !== index).map((image) => image.file);
    replaceImagePreviews(nextFiles);
    setPrimaryImageIndex((current) => {
      if (nextFiles.length === 0) {
        return 0;
      }

      if (current === index) {
        return 0;
      }

      return current > index ? current - 1 : current;
    });
  }

  function removeAllImages() {
    replaceImagePreviews([]);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  }

  function handleDepartmentChange(department: string) {
    const municipalities = departamentos[department] ?? [];

    setLocation((current) => ({
      ...current,
      department,
      municipality: municipalities[0] ?? "",
    }));
  }

  function toggleService(serviceId: number) {
    setSelectedServices((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId],
    );
  }

  function toggleRestriction(restrictionId: number) {
    setSelectedRestrictions((current) =>
      current.includes(restrictionId)
        ? current.filter((id) => id !== restrictionId)
        : [...current, restrictionId],
    );
  }

  function setDayEnabled(dayId: DayId, enabled: boolean) {
    setSchedule((current) => ({
      ...current,
      [dayId]: {
        ...current[dayId],
        enabled,
      },
    }));
  }

  function updateSlot(dayId: DayId, slotId: string, field: "open" | "close", value: string) {
    setSchedule((current) => ({
      ...current,
      [dayId]: {
        ...current[dayId],
        slots: current[dayId].slots.map((slot) =>
          slot.id === slotId ? { ...slot, [field]: value } : slot,
        ),
      },
    }));
  }

  function addSlot(dayId: DayId) {
    setSchedule((current) => ({
      ...current,
      [dayId]: {
        ...current[dayId],
        slots: [
          ...current[dayId].slots,
          {
            close: "",
            id: `${dayId}-${Date.now()}`,
            open: "",
          },
        ],
      },
    }));
  }

  function removeSlot(dayId: DayId, slotId: string) {
    setSchedule((current) => {
      const slots = current[dayId].slots;

      if (slots.length <= 1) {
        showNotice("Debe haber al menos un horario por día activo.");
        return current;
      }

      return {
        ...current,
        [dayId]: {
          ...current[dayId],
          slots: slots.filter((slot) => slot.id !== slotId),
        },
      };
    });
  }

  function updateVehicleCapacity(vehicleId: number, value: string) {
    setVehicleCapacities((current) => ({
      ...current,
      [vehicleId]: value,
    }));
  }

  function addRate() {
    const vehicle = catalog.vehicleTypes.find((item) => String(item.id) === rateDraft.vehicleTypeId);

    if (!vehicle || !rateDraft.feeType || !rateDraft.timeUnit || !rateDraft.appliesTo) {
      showNotice("Completa los campos principales de la tarifa.");
      return;
    }

    if (!rateDraft.isFree && !rateDraft.price.trim()) {
      showNotice("Agrega el precio o marca la tarifa como gratis.");
      return;
    }

    setRates((current) => [
      ...current,
      {
        ...rateDraft,
        id: `rate-${Date.now()}`,
        price: rateDraft.isFree ? "Gratis" : rateDraft.price,
        vehicleIcon: vehicle.icon,
        vehicleName: vehicle.categoryName,
      },
    ]);
    setRateDraft((current) => ({
      ...current,
      isFree: false,
      price: "",
      validFrom: "",
      validTo: "",
    }));
    setActiveModal(null);
  }

  function removeRate(rateId: string) {
    setRates((current) => current.filter((rate) => rate.id !== rateId));
  }

  async function handleDeleteParking() {
    if (!initialParking) {
      return;
    }

    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar ${initialParking.name}? Esta acción lo dejará inactivo.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/parkings/${encodeURIComponent(String(initialParking.dbId))}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string; success?: boolean };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "No se pudo eliminar el parqueo.");
      }

      setNotice("El parqueo se elimino correctamente.");
      router.push("/mis-parqueos");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo eliminar el parqueo.");
    } finally {
      setIsDeleting(false);
    }
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    const parsedCapacity = Number(capacityGeneral);

    event.preventDefault();

    if (!isEditMode && imagePreviews.length === 0) {
      showNotice("Debe subir al menos una imagen del parqueo.");
      return;
    }

    if (isEditMode && imagePreviews.length === 0 && existingParkingImages.length === 0 && !clearExistingImages) {
      showNotice("Debes conservar o subir al menos una imagen para continuar.");
      return;
    }

    if (!location.department || !location.municipality || !location.address) {
      showNotice("Configura la ubicación antes de publicar.");
      setActiveModal("location");
      return;
    }

    if (!selectedCategory) {
      showNotice("Selecciona una categoría antes de publicar.");
      setActiveModal("category");
      return;
    }

    if (!Number.isFinite(parsedCapacity) || parsedCapacity <= 0) {
      showNotice("Configura la capacidad general antes de publicar.");
      setActiveModal("capacity");
      return;
    }

    const formData = new FormData(event.currentTarget);
    formData.delete("imagenes");
    formData.delete("imagenes[]");
    imagePreviews.forEach((image) => {
      formData.append("imagenes[]", image.file, image.file.name);
    });

    formData.set("parking_mode", mode);
    if (initialParking) {
      formData.set("parking_id", String(initialParking.dbId));
    }
    if (isEditMode) {
      formData.set("clear_existing_images", clearExistingImages ? "1" : "0");
    }

    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>
          {isEditMode ? "Editar Parqueo" : "¡Publicá Tu Parqueo!"}
        </h1>

        {state.errorMessage ? (
          <div className={`${styles.alert} ${styles.alertError}`}>
            <i className="fas fa-exclamation-circle" aria-hidden="true" />
            <span>{state.errorMessage}</span>
          </div>
        ) : null}

        {state.successMessage ? (
          <div className={`${styles.alert} ${styles.alertSuccess}`}>
            <i className="fas fa-check-circle" aria-hidden="true" />
            <span>{state.successMessage}</span>
          </div>
        ) : null}

        {isEditMode && initialParking ? (
          <section className={styles.resultCard}>
            <div>
              <h2>Editando {initialParking.name}</h2>
              <p>
                Aquí puedes actualizar todos los campos del parqueo, reemplazar imágenes y borrar
                la publicación si ya no la necesitas.
              </p>
            </div>
            <div className={styles.resultActions}>
              <Link href={`/parqueos/${initialParking.id}`} className={styles.resultPrimary}>
                Ver detalle
              </Link>
              <Link href="/mis-parqueos" className={styles.resultSecondary}>
                Volver
              </Link>
            </div>
          </section>
        ) : null}

        <form action={formAction} className={styles.form} onSubmit={handleFormSubmit}>
          <section className={`${styles.formSection} ${styles.basicSection}`}>
            <div className={styles.semiSquare}>
              <h3 className={styles.center}>Información Básica</h3>
              <div className={styles.inputWithIcon}>
                <i className="fas fa-parking" aria-hidden="true" />
                <input
                  name="nombre"
                  placeholder="Nombre del parqueo"
                  required
                  type="text"
                  value={parkingName}
                  onChange={(event) => setParkingName(event.target.value)}
                />
              </div>
            </div>

            <div className={styles.actionButtons}>
              <button type="button" className={styles.btnAction} onClick={() => setActiveModal("category")}>
                <i className="fas fa-tag" aria-hidden="true" />
                {selectedCategory ? selectedCategory.name : "Categoría"}
              </button>
              <button type="button" className={styles.btnAction} onClick={() => setActiveModal("location")}>
                <i className="fas fa-map-marker-alt" aria-hidden="true" />
                Ubicación
              </button>
              <button type="button" className={styles.btnAction} onClick={() => setActiveModal("schedule")}>
                <i className="fas fa-clock" aria-hidden="true" />
                Horario
              </button>
            </div>

            <div className={styles.summaryContainer}>
              <SummaryItem icon="fa-tag" label="Categoría" value={selectedCategory?.name ?? "No seleccionada"} />
              <SummaryItem icon="fa-map-marker-alt" label="Ubicación" value={selectedLocationText || "Sin ubicación"} />
              <SummaryItem icon="fa-clock" label="Horario" value={scheduleSummary} />
            </div>
          </section>

          <section className={`${styles.formSection} ${styles.whiteSection}`}>
            <h3 className={styles.center}>
              <i className="fas fa-images" aria-hidden="true" /> Imágenes del Parqueo
            </h3>

            <div className={styles.imageUploadContainer}>
              {isEditMode && existingParkingImages.length > 0 && !clearExistingImages ? (
                <div className={styles.imagePreviewGrid}>
                  {existingParkingImages.map((image, index) => (
                    <div
                      key={`${initialParking?.id ?? "parking"}-existing-${index}`}
                      className={`${styles.imagePreviewItem} ${index === 0 && imagePreviews.length === 0 ? styles.mainImage : ""}`}
                    >
                      <img src={image} alt={`${initialParking?.name ?? "Parqueo"} ${index + 1}`} />
                      {index === 0 && imagePreviews.length === 0 ? (
                        <span className={styles.coverBadge}>Actual</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}

              <div className={styles.uploadActions}>
                <div>
                  <input
                    ref={imageInputRef}
                    id="parking-images"
                    name="imagenes[]"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    multiple
                    hidden
                    onChange={handleImagesSelected}
                  />
                  <label htmlFor="parking-images" className={styles.uploadBtn}>
                    <i className="fas fa-folder-open" aria-hidden="true" />{" "}
                    {isEditMode ? "Reemplazar imágenes" : "Elegir archivos"}
                  </label>
                </div>
                <span className={styles.fileCount}>
                  {imagePreviews.length === 0
                    ? isEditMode && existingParkingImages.length > 0 && !clearExistingImages
                      ? "Se conservarán las imágenes actuales"
                      : "Ningún archivo seleccionado"
                    : `${imagePreviews.length} archivo${imagePreviews.length > 1 ? "s" : ""} seleccionado${imagePreviews.length > 1 ? "s" : ""}`}
                </span>
                <button type="button" className={styles.removeAllBtn} onClick={removeAllImages}>
                  <i className="fas fa-trash-alt" aria-hidden="true" /> Eliminar todas
                </button>
                {isEditMode && existingParkingImages.length > 0 ? (
                  <button
                    type="button"
                    className={styles.removeAllBtn}
                    onClick={() => setClearExistingImages((current) => !current)}
                  >
                    <i className="fas fa-ban" aria-hidden="true" />{" "}
                    {clearExistingImages ? "Restaurar imágenes actuales" : "Eliminar imágenes actuales"}
                  </button>
                ) : null}
              </div>

              <div className={styles.imagePreviewGrid}>
                {imagePreviews.length > 0 ? (
                  imagePreviews.map((image, index) => (
                    <div
                      key={image.id}
                      className={`${styles.imagePreviewItem} ${
                        index === primaryImageIndex ? styles.mainImage : ""
                      }`}
                    >
                      <img src={image.url} alt={image.name} />
                      <div className={styles.imageActions}>
                        <button
                          type="button"
                          className={`${styles.starBtn} ${index === primaryImageIndex ? styles.starActive : ""}`}
                          title="Seleccionar como imagen principal"
                          onClick={() => setPrimaryImageIndex(index)}
                        >
                          <i className={`${index === primaryImageIndex ? "fas" : "far"} fa-star`} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className={styles.removeImageBtn}
                          title="Eliminar imagen"
                          onClick={() => removeImage(index)}
                        >
                          <i className="fas fa-times" aria-hidden="true" />
                        </button>
                      </div>
                      {index === primaryImageIndex ? <span className={styles.coverBadge}>Portada</span> : null}
                    </div>
                  ))
                ) : (
                  <div className={styles.noImages}>
                    <i className="fas fa-image" aria-hidden="true" />
                    <p>No hay imágenes seleccionadas</p>
                  </div>
                )}
              </div>

              <div className={styles.imageInstructions}>
                <p>
                  <i className="fas fa-info-circle" aria-hidden="true" /> Puedes subir hasta 8 imágenes.
                </p>
                <p>
                  <i className="fas fa-star" aria-hidden="true" /> Usa la estrella para elegir la portada.
                </p>
                <p>
                  <i className="fas fa-times" aria-hidden="true" /> Usa la X para quitar una imagen.
                </p>
                {isEditMode ? (
                  <p>
                    <i className="fas fa-clone" aria-hidden="true" /> Si subes archivos nuevos,
                    reemplazarán las imágenes actuales.
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <section className={`${styles.formSection} ${styles.capacitySection}`}>
            <h3 className={styles.center}>
              <i className="fas fa-car" aria-hidden="true" /> Capacidad
            </h3>
            <button type="button" className={styles.btnAction} onClick={() => setActiveModal("capacity")}>
              <i className="fas fa-edit" aria-hidden="true" /> Configurar Capacidad
            </button>

            <div className={styles.summaryContainer}>
              <SummaryItem icon="fa-users" label="Capacidad general" value={capacityGeneral || "No configurada"} />
              <SummaryItem
                icon="fa-calendar-check"
                label="Reservas"
                value={reservationsEnabled ? `${reservableCapacity || 0} reservables` : "Deshabilitadas"}
              />
              <SummaryItem icon="fa-wheelchair" label="Discapacitados" value={disabledSpaces || "0"} />
            </div>
          </section>

          <section className={`${styles.formSection} ${styles.contactSection}`}>
            <h3 className={styles.center}>
              <i className="fas fa-phone" aria-hidden="true" /> Contacto del Parqueo
            </h3>
            <div className={styles.contactGrid}>
              <div className={styles.inputWithIcon}>
                <i className="fas fa-user" aria-hidden="true" />
                <input
                  name="contacto_nombre"
                  placeholder="Nombre del contacto"
                  required
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                />
              </div>
              <div className={styles.inputWithIcon}>
                <i className="fas fa-phone" aria-hidden="true" />
                <input
                  name="contacto_telefono"
                  placeholder="Teléfono"
                  required
                  value={contactPhone}
                  onChange={(event) => setContactPhone(event.target.value)}
                />
              </div>
              <div className={styles.inputWithIcon}>
                <i className="fas fa-envelope" aria-hidden="true" />
                <input
                  name="contacto_email"
                  placeholder="Correo electrónico"
                  required
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                />
              </div>
            </div>
          </section>

          <section className={`${styles.formSection} ${styles.graySection}`}>
            <div className={styles.sectionHeader}>
              <h3>
                <i className="fas fa-dollar-sign" aria-hidden="true" /> Tarifas
              </h3>
              <button type="button" className={styles.btnAdd} onClick={() => setActiveModal("rate")}>
                <i className="fas fa-plus-circle" aria-hidden="true" /> Agregar Tarifa
              </button>
            </div>

            <div className={styles.ratesGrid}>
              {rates.length > 0 ? (
                rates.map((rate) => (
                  <article key={rate.id} className={styles.rateItem}>
                    <div className={styles.rateIcon}>
                      <i className={`fas fa-${rate.vehicleIcon}`} aria-hidden="true" />
                    </div>
                    <div className={styles.rateDetails}>
                      <h4>{rate.vehicleName}</h4>
                      <p>{rate.isFree ? "Gratis" : `$${rate.price}`} por {displayTimeUnit(rate.timeUnit)}</p>
                      <small>
                        Tipo: {rate.feeType} | Aplica: {rate.appliesTo}
                      </small>
                    </div>
                    <button type="button" className={styles.rateRemove} onClick={() => removeRate(rate.id)}>
                      <i className="fas fa-times" aria-hidden="true" />
                    </button>
                  </article>
                ))
              ) : (
                <p className={styles.noRates}>No hay tarifas agregadas</p>
              )}
            </div>
          </section>

          <section className={`${styles.formSection} ${styles.greenSection}`} id="servicesSection">
            <div className={styles.sectionHeader}>
              <h3>
                <i className="fas fa-concierge-bell" aria-hidden="true" /> Servicios
              </h3>
              <button type="button" className={styles.btnEdit} onClick={() => setActiveModal("services")}>
                <i className="fas fa-edit" aria-hidden="true" /> Editar
              </button>
            </div>

            <div className={styles.summaryContainer}>
              {servicesSummary.length > 0 ? (
                servicesSummary.map((service) => (
                  <div key={service} className={styles.summaryItem}>
                    <i className="fas fa-check-circle" aria-hidden="true" />
                    <span>{service}</span>
                  </div>
                ))
              ) : (
                <p className={styles.noInfo}>No se han seleccionado servicios</p>
              )}
            </div>
          </section>

          <section className={`${styles.formSection} ${styles.descriptionSection}`}>
            <h3 className={styles.center}>
              <i className="fas fa-align-left" aria-hidden="true" /> Descripción del Parqueo
            </h3>
            <div className={styles.infoContainer}>
              <textarea
                name="descripcion"
                placeholder="Describe tu parqueo (ubicación exacta, características especiales, beneficios, etc.)"
                required
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
          </section>

          <section className={`${styles.formSection} ${styles.redSection}`} id="restrictionsSection">
            <div className={styles.sectionHeader}>
              <h3>
                <i className="fas fa-ban" aria-hidden="true" /> Restricciones
              </h3>
              <button type="button" className={styles.btnEdit} onClick={() => setActiveModal("restrictions")}>
                <i className="fas fa-edit" aria-hidden="true" /> Editar
              </button>
            </div>
            <div className={styles.summaryContainer}>
              {restrictionsSummary.length > 0 ? (
                restrictionsSummary.map((restriction) => (
                  <div key={restriction} className={styles.summaryItem}>
                    <i className="fas fa-ban" aria-hidden="true" />
                    <span>{restriction}</span>
                  </div>
                ))
              ) : (
                <p className={styles.noInfo}>No se han configurado restricciones</p>
              )}
            </div>
          </section>

          <section className={`${styles.formSection} ${styles.orangeSection}`}>
            <div className={styles.sectionHeader}>
              <h3>
                <i className="fas fa-ruler-combined" aria-hidden="true" /> Restricciones Físicas
              </h3>
            </div>

            <div className={styles.physicalGrid}>
              <label className={styles.toggleCard}>
                <input
                  type="checkbox"
                  checked={isCovered}
                  onChange={(event) => {
                    setIsCovered(event.target.checked);
                    if (!event.target.checked) {
                      setMaxHeight("");
                    }
                  }}
                />
                <span>
                  <strong>Parqueo con techo</strong>
                  <small>La altura máxima solo aplica si hay techo, sótano o estructura cubierta.</small>
                </span>
              </label>
              <div className={`${styles.inputWithIcon} ${!isCovered ? styles.disabledInputWrap : ""}`}>
                <i className="fas fa-ruler-vertical" aria-hidden="true" />
                <input
                  inputMode="decimal"
                  placeholder="Altura máxima permitida (metros)"
                  disabled={!isCovered}
                  value={maxHeight}
                  onChange={(event) => setMaxHeight(event.target.value)}
                />
              </div>
              <div className={styles.inputWithIcon}>
                <i className="fas fa-tachometer-alt" aria-hidden="true" />
                <input
                  inputMode="numeric"
                  placeholder="Velocidad máxima (km/h, opcional)"
                  value={maxSpeed}
                  onChange={(event) => setMaxSpeed(event.target.value)}
                />
              </div>
            </div>
          </section>

          <section className={`${styles.formSection} ${styles.previewSection}`}>
            <h3 className={styles.center}>
              <i className="fas fa-eye" aria-hidden="true" /> Vista Previa
            </h3>
            <div className={styles.previewInline}>
              <div className={styles.previewMedia}>
                <img src={coverImage} alt="Vista previa del parqueo" />
              </div>
              <div className={styles.previewBody}>
                <span>{selectedCategory?.name ?? "Categoría"}</span>
                <h4>{parkingName || "Nombre del parqueo"}</h4>
                <p>{selectedLocationText || "Ubicación del parqueo"}</p>
                <p>{description || "Descripción breve del parqueo para revisar cómo se verá la publicación."}</p>
                <strong>{previewFee ? `${previewFee.isFree ? "Gratis" : `$${previewFee.price}`}/${displayTimeUnit(previewFee.timeUnit)}` : "Tarifa por definir"}</strong>
              </div>
            </div>
            <button type="button" className={styles.btnActionPurple} onClick={() => setActiveModal("preview")}>
              <i className="fas fa-search" aria-hidden="true" /> Ver Vista Previa Completa
            </button>
          </section>

          <section className={styles.submitSection}>
            {isEditMode ? (
              <p className={styles.termsAgreement}>
                <span>
                  Los cambios se guardan directamente sobre el parqueo publicado. Revisa la
                  información antes de guardar.
                </span>
              </p>
            ) : (
              <label className={styles.termsAgreement}>
                <input id="acceptTerms" name="accept_terms" required type="checkbox" />
                <span>
                  Acepto los términos y condiciones de Parking SV y la política de privacidad.
                </span>
              </label>
            )}

            <input type="hidden" name="categoria_id" value={selectedCategoryId} />
            <input type="hidden" name="departamento" value={location.department} />
            <input type="hidden" name="municipio" value={location.municipality} />
            <input type="hidden" name="direccion" value={location.address} />
            <input type="hidden" name="referencia" value={location.reference} />
            <input type="hidden" name="waze_link" value={location.wazeLink} />
            <input type="hidden" name="google_maps_link" value={location.googleMapsLink} />
            <input type="hidden" name="schedule_json" value={hiddenScheduleJson} />
            <input type="hidden" name="is_24_7" value={is24_7 ? "1" : "0"} />
            <input type="hidden" name="servicios" value={selectedServices.join(",")} />
            <input type="hidden" name="restricciones" value={selectedRestrictions.join(",")} />
            <input type="hidden" name="capacidad_general" value={capacityGeneral} />
            <input type="hidden" name="reservable_capacity" value={reservationsEnabled ? reservableCapacity || capacityGeneral || "0" : "0"} />
            <input type="hidden" name="espacios_discapacitados" value={disabledSpaces || "0"} />
            <input type="hidden" name="altura_maxima" value={isCovered ? maxHeight : ""} />
            <input type="hidden" name="velocidad_maxima" value={maxSpeed} />
            <input type="hidden" name="imagen_principal" value={primaryImageIndex} />
            <input type="hidden" name="parking_revision" value={String(state.revision)} />
            <input type="hidden" name="parking_mode" value={mode} />
            {initialParking ? <input type="hidden" name="parking_id" value={String(initialParking.dbId)} /> : null}
            {isEditMode ? (
              <input
                type="hidden"
                name="clear_existing_images"
                value={clearExistingImages ? "1" : "0"}
              />
            ) : null}

            {catalog.vehicleTypes.map((vehicle) => (
              <input
                key={vehicle.id}
                type="hidden"
                name={`capacidad_vehiculo[${vehicle.id}]`}
                value={vehicleCapacities[vehicle.id] ?? "0"}
              />
            ))}

            {rates.map((rate) => (
              <div key={rate.id} hidden>
                <input name="tarifa_vehicle_type[]" value={rate.vehicleTypeId} readOnly />
                <input name="tarifa_tipo[]" value={rate.feeType} readOnly />
                <input name="tarifa_precio[]" value={rate.isFree ? "Gratis" : rate.price} readOnly />
                <input name="tarifa_unidad[]" value={rate.timeUnit} readOnly />
                <input name="tarifa_dias[]" value={rate.appliesTo} readOnly />
                <input name="tarifa_validez_inicio[]" value={rate.validFrom} readOnly />
                <input name="tarifa_validez_fin[]" value={rate.validTo} readOnly />
              </div>
            ))}

            <PublishParkingSubmitButton
              label={isEditMode ? "Guardar cambios" : "Publicar Parqueo"}
              pending={isPublishing}
              pendingLabel={isEditMode ? "Guardando..." : "Publicando..."}
            />
          </section>
        </form>

        {state.publishedParkingId ? (
          <section className={styles.resultCard}>
            <div>
              <h2>{isEditMode ? "Tu parqueo ya fue actualizado" : "Tu parqueo ya fue publicado"}</h2>
              <p>
                {isEditMode
                  ? "Los cambios se guardaron correctamente y ya están visibles en la plataforma."
                  : "La información se guardó correctamente y ya puedes revisarla en la plataforma."}
              </p>
            </div>
            <div className={styles.resultActions}>
              <Link href={`/parqueos/${state.publishedParkingId}`} className={styles.resultPrimary}>
                {isEditMode ? "Ver detalle actualizado" : "Ver detalle publicado"}
              </Link>
              <Link href="/mis-parqueos" className={styles.resultSecondary}>
                Volver a mis parqueos
              </Link>
            </div>
          </section>
        ) : null}

        {isEditMode && initialParking ? (
          <section className={`${styles.formSection} ${styles.redSection}`} style={{ marginTop: "1.25rem" }}>
            <h3 className={styles.center}>
              <i className="fas fa-triangle-exclamation" aria-hidden="true" /> Zona peligrosa
            </h3>
            <p className={styles.noInfo} style={{ marginBottom: "1rem" }}>
              Si ya no quieres mostrar este parqueo, puedes eliminarlo desde aquí. Se marcará como
              inactivo y dejará de aparecer en la lista pública.
            </p>
            <div className={styles.resultActions} style={{ justifyContent: "center" }}>
              <button
                type="button"
                className={styles.btnDanger}
                onClick={() => void handleDeleteParking()}
                disabled={isDeleting}
              >
                <i className="fas fa-trash-can" aria-hidden="true" />{" "}
                {isDeleting ? "Eliminando..." : "Eliminar parqueo"}
              </button>
            </div>
          </section>
        ) : null}
      </div>

      {activeModal ? (
        <ModalShell title={resolveModalTitle(activeModal)} icon={resolveModalIcon(activeModal)} onClose={() => setActiveModal(null)}>
          {activeModal === "category" ? (
            <CategoryModal
              categories={catalog.categories}
              selectedCategoryId={selectedCategoryId}
              onSelect={setSelectedCategoryId}
              onClose={() => setActiveModal(null)}
            />
          ) : null}

          {activeModal === "location" ? (
            <LocationModal
              location={location}
              onDepartmentChange={handleDepartmentChange}
              onLocationChange={setLocation}
              onClose={() => setActiveModal(null)}
            />
          ) : null}

          {activeModal === "schedule" ? (
            <ScheduleModal
              is24_7={is24_7}
              schedule={schedule}
              onAddSlot={addSlot}
              onClose={() => setActiveModal(null)}
              onRemoveSlot={removeSlot}
              onSetDayEnabled={setDayEnabled}
              onSetIs24_7={setIs24_7}
              onUpdateSlot={updateSlot}
            />
          ) : null}

          {activeModal === "capacity" ? (
            <CapacityModal
              capacityGeneral={capacityGeneral}
              disabledSpaces={disabledSpaces}
              reservationsEnabled={reservationsEnabled}
              reservableCapacity={reservableCapacity}
              vehicleCapacities={vehicleCapacities}
              vehicleTypes={catalog.vehicleTypes}
              onClose={() => setActiveModal(null)}
              onSetCapacityGeneral={setCapacityGeneral}
              onSetDisabledSpaces={setDisabledSpaces}
              onSetReservationsEnabled={setReservationsEnabled}
              onSetReservableCapacity={setReservableCapacity}
              onUpdateVehicleCapacity={updateVehicleCapacity}
            />
          ) : null}

          {activeModal === "rate" ? (
            <RateModal
              draft={rateDraft}
              vehicleTypes={catalog.vehicleTypes}
              onAddRate={addRate}
              onClose={() => setActiveModal(null)}
              onDraftChange={setRateDraft}
            />
          ) : null}

          {activeModal === "services" ? (
            <PickerModal
              items={catalog.services}
              kind="service"
              selectedIds={selectedServices}
              onClose={() => setActiveModal(null)}
              onToggle={toggleService}
            />
          ) : null}

          {activeModal === "restrictions" ? (
            <PickerModal
              items={catalog.restrictions}
              kind="restriction"
              selectedIds={selectedRestrictions}
              onClose={() => setActiveModal(null)}
              onToggle={toggleRestriction}
            />
          ) : null}

          {activeModal === "preview" ? (
            <PreviewModal
              category={selectedCategory}
              coverImage={coverImage}
              description={description}
              locationText={selectedLocationText}
              parkingName={parkingName}
              rate={previewFee}
              reservationsEnabled={reservationsEnabled}
              scheduleSummary={scheduleSummary}
              services={servicesSummary}
              onClose={() => setActiveModal(null)}
            />
          ) : null}
        </ModalShell>
      ) : null}

      {notice ? <div className={styles.toast}>{notice}</div> : null}
    </section>
  );
}

function SummaryItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className={styles.summaryItem}>
      <i className={`fas ${icon}`} aria-hidden="true" />
      <span>
        <strong>{label}:</strong> {value}
      </span>
    </div>
  );
}

function ModalShell({
  children,
  icon,
  onClose,
  title,
}: {
  children: ReactNode;
  icon: string;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>
            <i className={`fas ${icon}`} aria-hidden="true" /> {title}
          </h3>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Cerrar modal">
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CategoryModal({
  categories,
  onClose,
  onSelect,
  selectedCategoryId,
}: {
  categories: PublishParkingCategory[];
  onClose: () => void;
  onSelect: (categoryId: number) => void;
  selectedCategoryId: number;
}) {
  return (
    <>
      <div className={styles.modalBody}>
        <div className={styles.categoriesList}>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`${styles.categoryItem} ${
                selectedCategoryId === category.id ? styles.selectedItem : ""
              }`}
              onClick={() => onSelect(category.id)}
            >
              <div className={styles.categoryIcon}>
                <i className={`fas ${category.icon}`} aria-hidden="true" />
              </div>
              <div className={styles.categoryInfo}>
                <h4>{category.name}</h4>
                <p>{category.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className={styles.modalFooter}>
        <button type="button" className={styles.btnSave} onClick={onClose}>
          Confirmar
        </button>
      </div>
    </>
  );
}

function LocationModal({
  location,
  onClose,
  onDepartmentChange,
  onLocationChange,
}: {
  location: LocationState;
  onClose: () => void;
  onDepartmentChange: (department: string) => void;
  onLocationChange: Dispatch<SetStateAction<LocationState>>;
}) {
  const municipalities = location.department ? departamentos[location.department] ?? [] : [];

  return (
    <>
      <div className={styles.modalBody}>
        <div className={styles.modalFields}>
          <FieldLabel icon="fa-map" label="Departamento">
            <div className={styles.selectContainer}>
              <select value={location.department} onChange={(event) => onDepartmentChange(event.target.value)}>
                <option value="">Seleccione un departamento</option>
                {Object.keys(departamentos).map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
              <i className="fas fa-chevron-down" aria-hidden="true" />
            </div>
          </FieldLabel>

          <FieldLabel icon="fa-city" label="Municipio">
            <div className={styles.selectContainer}>
              <select
                value={location.municipality}
                onChange={(event) =>
                  onLocationChange((current) => ({ ...current, municipality: event.target.value }))
                }
              >
                <option value="">Primero seleccione un departamento</option>
                {municipalities.map((municipality) => (
                  <option key={municipality} value={municipality}>
                    {municipality}
                  </option>
                ))}
              </select>
              <i className="fas fa-chevron-down" aria-hidden="true" />
            </div>
          </FieldLabel>

          <FieldLabel icon="fa-road" label="Dirección exacta">
            <div className={styles.inputWithIcon}>
              <i className="fas fa-map-pin" aria-hidden="true" />
              <input
                placeholder="Ej: Calle Principal #123"
                value={location.address}
                onChange={(event) => onLocationChange((current) => ({ ...current, address: event.target.value }))}
              />
            </div>
          </FieldLabel>

          <FieldLabel icon="fa-info-circle" label="Referencia (opcional)">
            <div className={styles.inputWithIcon}>
              <i className="fas fa-map-marker-alt" aria-hidden="true" />
              <input
                placeholder="Ej: Frente a Centro Comercial"
                value={location.reference}
                onChange={(event) => onLocationChange((current) => ({ ...current, reference: event.target.value }))}
              />
            </div>
          </FieldLabel>

          <FieldLabel icon="fa-link" label="Enlace de Waze (opcional)">
            <div className={styles.inputWithIcon}>
              <i className="fas fa-link" aria-hidden="true" />
              <input
                placeholder="https://www.waze.com/..."
                value={location.wazeLink}
                onChange={(event) => onLocationChange((current) => ({ ...current, wazeLink: event.target.value }))}
              />
            </div>
          </FieldLabel>

          <FieldLabel icon="fa-link" label="Enlace de Google Maps (opcional)">
            <div className={styles.inputWithIcon}>
              <i className="fas fa-link" aria-hidden="true" />
              <input
                placeholder="https://www.google.com/maps/..."
                value={location.googleMapsLink}
                onChange={(event) =>
                  onLocationChange((current) => ({ ...current, googleMapsLink: event.target.value }))
                }
              />
            </div>
          </FieldLabel>
        </div>
      </div>
      <div className={styles.modalFooter}>
        <button type="button" className={styles.btnSave} onClick={onClose}>
          Guardar
        </button>
      </div>
    </>
  );
}

function ScheduleModal({
  is24_7,
  onAddSlot,
  onClose,
  onRemoveSlot,
  onSetDayEnabled,
  onSetIs24_7,
  onUpdateSlot,
  schedule,
}: {
  is24_7: boolean;
  onAddSlot: (dayId: DayId) => void;
  onClose: () => void;
  onRemoveSlot: (dayId: DayId, slotId: string) => void;
  onSetDayEnabled: (dayId: DayId, enabled: boolean) => void;
  onSetIs24_7: (value: boolean) => void;
  onUpdateSlot: (dayId: DayId, slotId: string, field: "open" | "close", value: string) => void;
  schedule: Record<DayId, ScheduleDayState>;
}) {
  return (
    <>
      <div className={styles.modalBody}>
        <label className={styles.is247}>
          <input type="checkbox" checked={is24_7} onChange={(event) => onSetIs24_7(event.target.checked)} />
          <span>
            <i className="fas fa-clock" aria-hidden="true" /> Abierto 24/7
          </span>
        </label>

        {!is24_7 ? (
          <div className={styles.scheduleContainer}>
            {dayLabels.map((day) => (
              <div key={day.id} className={styles.daySchedule}>
                <label className={styles.dayLabel}>
                  <input
                    type="checkbox"
                    checked={schedule[day.id].enabled}
                    onChange={(event) => onSetDayEnabled(day.id, event.target.checked)}
                  />
                  <span>{day.label}</span>
                </label>

                {schedule[day.id].enabled ? (
                  <div className={styles.timeSlots}>
                    {schedule[day.id].slots.map((slot) => (
                      <div key={slot.id} className={styles.timeSlot}>
                        <div className={styles.timeInputGroup}>
                          <i className="fas fa-door-open" aria-hidden="true" />
                          <input
                            type="time"
                            value={slot.open}
                            onChange={(event) => onUpdateSlot(day.id, slot.id, "open", event.target.value)}
                          />
                        </div>
                        <div className={styles.timeInputGroup}>
                          <i className="fas fa-door-closed" aria-hidden="true" />
                          <input
                            type="time"
                            value={slot.close}
                            onChange={(event) => onUpdateSlot(day.id, slot.id, "close", event.target.value)}
                          />
                        </div>
                        <button type="button" className={styles.addSlotBtn} onClick={() => onAddSlot(day.id)}>
                          <i className="fas fa-plus" aria-hidden="true" />
                        </button>
                        <button type="button" className={styles.removeSlotBtn} onClick={() => onRemoveSlot(day.id, slot.id)}>
                          <i className="fas fa-minus" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className={styles.modalFooter}>
        <button type="button" className={styles.btnSave} onClick={onClose}>
          Guardar
        </button>
      </div>
    </>
  );
}

function CapacityModal({
  capacityGeneral,
  disabledSpaces,
  onClose,
  onSetCapacityGeneral,
  onSetDisabledSpaces,
  onSetReservationsEnabled,
  onSetReservableCapacity,
  onUpdateVehicleCapacity,
  reservationsEnabled,
  reservableCapacity,
  vehicleCapacities,
  vehicleTypes,
}: {
  capacityGeneral: string;
  disabledSpaces: string;
  onClose: () => void;
  onSetCapacityGeneral: (value: string) => void;
  onSetDisabledSpaces: (value: string) => void;
  onSetReservationsEnabled: (value: boolean) => void;
  onSetReservableCapacity: (value: string) => void;
  onUpdateVehicleCapacity: (vehicleId: number, value: string) => void;
  reservationsEnabled: boolean;
  reservableCapacity: string;
  vehicleCapacities: Record<number, string>;
  vehicleTypes: PublishParkingVehicleType[];
}) {
  return (
    <>
      <div className={styles.modalBody}>
        <div className={styles.capacityGroup}>
          <label>
            <i className="fas fa-users" aria-hidden="true" /> Capacidad general:
          </label>
          <input type="number" min="1" value={capacityGeneral} onChange={(event) => onSetCapacityGeneral(event.target.value)} />
        </div>
        <div className={styles.capacityGroup}>
          <label>
            <i className="fas fa-calendar-check" aria-hidden="true" /> Reservas:
          </label>
          <label className={styles.switchRow}>
            <input
              type="checkbox"
              checked={reservationsEnabled}
              onChange={(event) => onSetReservationsEnabled(event.target.checked)}
            />
            <span>{reservationsEnabled ? "Habilitadas" : "Deshabilitadas"}</span>
          </label>
        </div>
        {reservationsEnabled ? (
          <div className={styles.capacityGroup}>
            <label>
              <i className="fas fa-calendar-plus" aria-hidden="true" /> Espacios reservables:
            </label>
            <input
              type="number"
              min="0"
              value={reservableCapacity}
              onChange={(event) => onSetReservableCapacity(event.target.value)}
            />
          </div>
        ) : null}
        <div className={styles.capacityGroup}>
          <label>
            <i className="fas fa-wheelchair" aria-hidden="true" /> Espacios para discapacitados:
          </label>
          <input type="number" min="0" value={disabledSpaces} onChange={(event) => onSetDisabledSpaces(event.target.value)} />
        </div>

        <h4 className={styles.modalSubtitle}>
          <i className="fas fa-car-side" aria-hidden="true" /> Capacidad por tipo de vehículo
        </h4>
        <div className={styles.vehicleCapacityGrid}>
          {vehicleTypes.map((vehicle) => (
            <div key={vehicle.id} className={styles.capacityCard}>
              <label>
                <i className={`fas fa-${vehicle.icon}`} aria-hidden="true" />
                {vehicle.categoryName}
              </label>
              <input
                type="number"
                min="0"
                value={vehicleCapacities[vehicle.id] ?? ""}
                onChange={(event) => onUpdateVehicleCapacity(vehicle.id, event.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
      <div className={styles.modalFooter}>
        <button type="button" className={styles.btnSave} onClick={onClose}>
          Guardar
        </button>
      </div>
    </>
  );
}

function RateModal({
  draft,
  onAddRate,
  onClose,
  onDraftChange,
  vehicleTypes,
}: {
  draft: RateDraft;
  onAddRate: () => void;
  onClose: () => void;
  onDraftChange: Dispatch<SetStateAction<RateDraft>>;
  vehicleTypes: PublishParkingVehicleType[];
}) {
  return (
    <>
      <div className={`${styles.modalBody} ${styles.rateModalBody}`}>
        <OptionGroup label="Tipo de Vehículo" icon="fa-car">
          <div className={styles.selectableOptions}>
            {vehicleTypes.map((vehicle) => (
              <button
                key={vehicle.id}
                type="button"
                className={`${styles.selectableOption} ${draft.vehicleTypeId === String(vehicle.id) ? styles.optionSelected : ""}`}
                onClick={() => onDraftChange((current) => ({ ...current, vehicleTypeId: String(vehicle.id) }))}
              >
                <i className={`fas fa-${vehicle.icon}`} aria-hidden="true" />
                <span>{vehicle.categoryName}</span>
              </button>
            ))}
          </div>
        </OptionGroup>

        <OptionGroup label="Tipo de Tarifa" icon="fa-tag">
          <div className={styles.selectableOptions}>
            {feeTypeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`${styles.selectableOption} ${draft.feeType === option.value ? styles.optionSelected : ""}`}
                onClick={() => onDraftChange((current) => ({ ...current, feeType: option.value }))}
              >
                <i className={`fas ${option.icon}`} aria-hidden="true" />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </OptionGroup>

        <OptionGroup label="¿Es gratuita?" icon="fa-money-bill-wave">
          <div className={styles.rateFreeToggle}>
            <button
              type="button"
              className={`${styles.toggleRateFree} ${draft.isFree ? styles.toggleActive : ""}`}
              onClick={() => onDraftChange((current) => ({ ...current, isFree: true, price: "" }))}
            >
              <i className="fas fa-gift" aria-hidden="true" /> Gratis
            </button>
            <button
              type="button"
              className={`${styles.toggleRateFree} ${!draft.isFree ? styles.toggleActive : ""}`}
              onClick={() => onDraftChange((current) => ({ ...current, isFree: false }))}
            >
              <i className="fas fa-dollar-sign" aria-hidden="true" /> Precio
            </button>
          </div>
        </OptionGroup>

        {!draft.isFree ? (
          <FieldLabel icon="fa-dollar-sign" label="Precio">
            <div className={styles.inputWithIcon}>
              <i className="fas fa-money-bill-wave" aria-hidden="true" />
              <input
                inputMode="decimal"
                placeholder="0.00"
                value={draft.price}
                onChange={(event) => onDraftChange((current) => ({ ...current, price: event.target.value }))}
              />
            </div>
          </FieldLabel>
        ) : null}

        <OptionGroup label="Unidad de Tiempo" icon="fa-clock">
          <div className={styles.selectableOptions}>
            {timeUnitOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`${styles.selectableOption} ${draft.timeUnit === option.value ? styles.optionSelected : ""}`}
                onClick={() => onDraftChange((current) => ({ ...current, timeUnit: option.value }))}
              >
                <i className={`fas ${option.icon}`} aria-hidden="true" />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </OptionGroup>

        <OptionGroup label="Aplica a" icon="fa-calendar">
          <div className={styles.selectableOptions}>
            {appliesToOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`${styles.selectableOption} ${draft.appliesTo === option.value ? styles.optionSelected : ""}`}
                onClick={() => onDraftChange((current) => ({ ...current, appliesTo: option.value }))}
              >
                <i className={`fas ${option.icon}`} aria-hidden="true" />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </OptionGroup>

        <div className={styles.dateGrid}>
          <FieldLabel icon="fa-calendar-check" label="Validez desde (opcional)">
            <div className={styles.inputWithIcon}>
              <i className="fas fa-calendar-day" aria-hidden="true" />
              <input
                type="date"
                value={draft.validFrom}
                onChange={(event) => onDraftChange((current) => ({ ...current, validFrom: event.target.value }))}
              />
            </div>
          </FieldLabel>
          <FieldLabel icon="fa-calendar-times" label="Validez hasta (opcional)">
            <div className={styles.inputWithIcon}>
              <i className="fas fa-calendar-times" aria-hidden="true" />
              <input
                type="date"
                value={draft.validTo}
                onChange={(event) => onDraftChange((current) => ({ ...current, validTo: event.target.value }))}
              />
            </div>
          </FieldLabel>
        </div>
      </div>
      <div className={styles.modalFooter}>
        <button type="button" className={styles.btnGhost} onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className={styles.btnSave} onClick={onAddRate}>
          Guardar Tarifa
        </button>
      </div>
    </>
  );
}

function PickerModal({
  items,
  kind,
  onClose,
  onToggle,
  selectedIds,
}: {
  items: PublishParkingService[] | PublishParkingRestriction[];
  kind: "restriction" | "service";
  onClose: () => void;
  onToggle: (id: number) => void;
  selectedIds: number[];
}) {
  return (
    <>
      <div className={styles.modalBody}>
        <div className={kind === "service" ? styles.servicesGrid : styles.restrictionsGrid}>
          {items.map((item) => {
            const isActive = selectedIds.includes(item.id);
            const icon = "icon" in item ? item.icon : "fa-ban";

            return (
              <button
                key={item.id}
                type="button"
                className={`${kind === "service" ? styles.serviceItem : styles.restrictionItem} ${
                  isActive ? styles.pickerActive : ""
                }`}
                onClick={() => onToggle(item.id)}
              >
                <div className={kind === "service" ? styles.serviceIcon : styles.restrictionIcon}>
                  <i className={`fas ${icon}`} aria-hidden="true" />
                </div>
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className={styles.modalFooter}>
        <button type="button" className={styles.btnSave} onClick={onClose}>
          {kind === "service" ? "Guardar Servicios" : "Guardar Restricciones"}
        </button>
      </div>
    </>
  );
}

function PreviewModal({
  category,
  coverImage,
  description,
  locationText,
  onClose,
  parkingName,
  rate,
  reservationsEnabled,
  scheduleSummary,
  services,
}: {
  category?: PublishParkingCategory;
  coverImage: string;
  description: string;
  locationText: string;
  onClose: () => void;
  parkingName: string;
  rate?: RateItem;
  reservationsEnabled: boolean;
  scheduleSummary: string;
  services: string[];
}) {
  return (
    <>
      <div className={styles.modalBody}>
        <article className={styles.previewCard}>
          <div className={styles.previewCardMedia}>
            <img src={coverImage} alt="Vista previa del parqueo" />
            <span>{category?.name ?? "Categoría"}</span>
          </div>
          <div className={styles.previewCardBody}>
            <h3>{parkingName || "Nombre del parqueo"}</h3>
            <p className={styles.previewLocation}>
              <i className="fas fa-map-marker-alt" aria-hidden="true" /> {locationText || "Ubicación del parqueo"}
            </p>
            <p>{description || "Descripción del parqueo."}</p>
            <div className={styles.previewFacts}>
              <span>
                <i className="fas fa-clock" aria-hidden="true" /> {scheduleSummary}
              </span>
              <span>
                <i className="fas fa-calendar-check" aria-hidden="true" />{" "}
                {reservationsEnabled ? "Reservas habilitadas" : "Sin reservas"}
              </span>
              <span>
                <i className="fas fa-dollar-sign" aria-hidden="true" />{" "}
                {rate ? `${rate.isFree ? "Gratis" : `$${rate.price}`}/${displayTimeUnit(rate.timeUnit)}` : "Tarifa por definir"}
              </span>
            </div>
            {services.length > 0 ? (
              <div className={styles.previewServices}>
                {services.slice(0, 6).map((service) => (
                  <span key={service}>{service}</span>
                ))}
              </div>
            ) : null}
          </div>
        </article>
      </div>
      <div className={styles.modalFooter}>
        <button type="button" className={styles.btnSave} onClick={onClose}>
          Cerrar vista previa
        </button>
      </div>
    </>
  );
}

function FieldLabel({
  children,
  icon,
  label,
}: {
  children: ReactNode;
  icon: string;
  label: string;
}) {
  return (
    <label className={styles.fieldLabel}>
      <span>
        <i className={`fas ${icon}`} aria-hidden="true" /> {label}:
      </span>
      {children}
    </label>
  );
}

function OptionGroup({
  children,
  icon,
  label,
}: {
  children: ReactNode;
  icon: string;
  label: string;
}) {
  return (
    <div className={styles.optionGroup}>
      <label>
        <i className={`fas ${icon}`} aria-hidden="true" /> {label}:
      </label>
      {children}
    </div>
  );
}

function resolveModalTitle(modal: Exclude<ModalKey, null>) {
  switch (modal) {
    case "capacity":
      return "Configurar Capacidad";
    case "category":
      return "Seleccione una categoría";
    case "location":
      return "Ubicación";
    case "preview":
      return "Vista Previa";
    case "rate":
      return "Agregar Tarifa";
    case "restrictions":
      return "Restricciones";
    case "schedule":
      return "Horario";
    case "services":
      return "Seleccionar Servicios";
    default:
      return "";
  }
}

function resolveModalIcon(modal: Exclude<ModalKey, null>) {
  switch (modal) {
    case "capacity":
      return "fa-car";
    case "category":
      return "fa-tag";
    case "location":
      return "fa-map-marker-alt";
    case "preview":
      return "fa-eye";
    case "rate":
      return "fa-dollar-sign";
    case "restrictions":
      return "fa-ban";
    case "schedule":
      return "fa-clock";
    case "services":
      return "fa-concierge-bell";
    default:
      return "fa-circle";
  }
}

function formatParkingLocation(department: string, municipality: string) {
  if (!department && !municipality) {
    return "";
  }

  return normalizeText(department) === normalizeText(municipality)
    ? department
    : [department, municipality].filter(Boolean).join(", ");
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function displayTimeUnit(value: string) {
  return value === "dia" ? "día" : value;
}

function resolveInitialCategoryId(
  categories: PublishParkingCategory[],
  categoryKey: string | undefined,
  fallbackId: number,
) {
  if (!categoryKey) {
    return fallbackId;
  }

  const normalizedCategory = normalizeText(categoryKey);
  const matchedCategory = categories.find((category) => normalizeText(category.name) === normalizedCategory);

  return matchedCategory?.id ?? fallbackId;
}

function normalizeTimeUnitForForm(value: string | null | undefined) {
  const normalized = normalizeText(value ?? "");

  if (normalized.startsWith("minuto")) {
    return "minuto";
  }

  if (normalized.startsWith("hora")) {
    return "hora";
  }

  if (normalized.startsWith("dia")) {
    return "dia";
  }

  if (normalized.startsWith("semana")) {
    return "semana";
  }

  if (normalized.startsWith("mes")) {
    return "mes";
  }

  return "hora";
}

function buildInitialSchedule(parking?: Parking | null): Record<DayId, ScheduleDayState> {
  if (!parking) {
    return defaultSchedule;
  }

  const scheduleEntries = parking.schedule ?? {};

  return dayLabels.reduce((acc, day) => {
    const slots = scheduleEntries[day.id as ParkingDayKey] ?? [];

    if (slots.length > 0) {
      acc[day.id] = {
        enabled: true,
        slots: slots.map((slot, index) => ({
          close: slot.cierre,
          id: `${day.id}-${index + 1}`,
          open: slot.apertura,
        })),
      };
      return acc;
    }

    acc[day.id] = {
      enabled: Boolean(parking.is24_7),
      slots: [
        {
          close: parking.is24_7 ? "23:59" : "",
          id: `${day.id}-1`,
          open: parking.is24_7 ? "00:00" : "",
        },
      ],
    };

    return acc;
  }, {} as Record<DayId, ScheduleDayState>);
}

function buildInitialVehicleCapacities(parking?: Parking | null) {
  if (!parking) {
    return {};
  }

  return parking.vehicleCapacities.reduce<Record<number, string>>((acc, capacity) => {
    acc[capacity.id] = String(capacity.capacity);
    return acc;
  }, {});
}

function buildInitialSelectedServices(
  services: PublishParkingService[],
  parking?: Parking | null,
) {
  if (!parking) {
    return [];
  }

  return parking.services
    .map((service) => services.find((item) => normalizeText(item.name) === normalizeText(service.value)))
    .filter((service): service is PublishParkingService => Boolean(service))
    .map((service) => service.id);
}

function buildInitialSelectedRestrictions(
  restrictions: PublishParkingRestriction[],
  parking?: Parking | null,
) {
  if (!parking) {
    return [];
  }

  return parking.restrictions.behavioral
    .map((restriction) =>
      restrictions.find((item) => normalizeText(item.name) === normalizeText(restriction)),
    )
    .filter((restriction): restriction is PublishParkingRestriction => Boolean(restriction))
    .map((restriction) => restriction.id);
}

function buildInitialRateDraft(
  vehicleTypes: PublishParkingVehicleType[],
  parking: Parking | null | undefined,
  firstVehicle: PublishParkingVehicleType | undefined,
): RateDraft {
  const initialFee = parking?.fees[0];
  const matchedVehicle = initialFee
    ? vehicleTypes.find((vehicle) => normalizeText(vehicle.categoryName) === normalizeText(initialFee.vehicleType))
    : null;

  return {
    appliesTo: initialFee ? normalizeAppliesToForDisplay(initialFee.appliesTo) : "Toda la semana",
    feeType: initialFee?.feeType ?? "normal",
    isFree: Boolean(initialFee && /gratis/i.test(initialFee.price)),
    price: initialFee && !/gratis/i.test(initialFee.price) ? initialFee.price.replace(/^\$/, "") : "",
    timeUnit: initialFee ? normalizeTimeUnitForForm(initialFee.timeUnit) : "hora",
    validFrom: initialFee?.validFrom ?? "",
    validTo: initialFee?.validTo ?? "",
    vehicleTypeId: String(matchedVehicle?.id ?? firstVehicle?.id ?? ""),
  };
}

function buildInitialRates(
  vehicleTypes: PublishParkingVehicleType[],
  parking?: Parking | null,
): RateItem[] {
  if (!parking) {
    return [];
  }

  return parking.fees.map((fee, index) => {
    const matchedVehicle = vehicleTypes.find(
      (vehicle) => normalizeText(vehicle.categoryName) === normalizeText(fee.vehicleType),
    );
    const isFree = /gratis/i.test(fee.price);

    return {
      appliesTo: normalizeAppliesToForDisplay(fee.appliesTo),
      feeType: fee.feeType,
      id: `parking-fee-${fee.id}-${index}`,
      isFree,
      price: isFree ? "Gratis" : fee.price.replace(/^\$/, ""),
      timeUnit: normalizeTimeUnitForForm(fee.timeUnit),
      validFrom: fee.validFrom ?? "",
      validTo: fee.validTo ?? "",
      vehicleIcon: matchedVehicle?.icon ?? "car",
      vehicleName: matchedVehicle?.categoryName ?? fee.vehicleType,
      vehicleTypeId: String(matchedVehicle?.id ?? ""),
    };
  });
}

function normalizeAppliesToForDisplay(value: string | undefined | null) {
  const normalized = normalizeText(value ?? "");

  if (normalized.includes("laboral")) {
    return "Días laborales";
  }

  if (normalized.includes("fin")) {
    return "Fines de semana";
  }

  return "Toda la semana";
}
