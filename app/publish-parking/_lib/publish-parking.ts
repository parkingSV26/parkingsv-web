import "server-only";

import { randomUUID } from "node:crypto";
import type { SessionUser } from "@/app/lib/auth/session";
import type { ParkingDayKey, ScheduleSlot } from "@/app/parkings/parking-data";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { formatSupabaseErrorForLog } from "@/src/lib/supabase/errors";
import { getParkingBucketName } from "@/src/lib/supabase/server-env";
import type {
  PublishParkingCatalog,
  PublishParkingCategory,
  PublishParkingRestriction,
  PublishParkingService,
  PublishParkingVehicleType,
} from "./publish-parking-types";

type ScheduleDraftSlot = {
  close: string;
  open: string;
};

type ScheduleDraftDay = {
  close?: string;
  enabled: boolean;
  open?: string;
  slots?: ScheduleDraftSlot[];
};

type PublishParkingImage = {
  path: string;
  url: string;
};

type PublishParkingCatalogRow = {
  category_key?: string | null;
  description?: string | null;
  icon?: string | null;
  id: number;
  name?: string | null;
  category_name?: string | null;
};

type PublishParkingResult = {
  parkingId: number;
};

const MAX_IMAGE_COUNT = 8;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const allowedImageTypes: Record<string, string> = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const fallbackCategories: PublishParkingCategory[] = [
  {
    description: "Parqueo estándar con características comunes.",
    icon: "fa-car",
    id: 1,
    name: "Normal",
  },
  {
    description: "Alta rotación de vehículos, usualmente en zonas comerciales.",
    icon: "fa-car-alt",
    id: 2,
    name: "Alta demanda",
  },
  {
    description: "Cercano a atracciones turísticas, con servicios para visitantes.",
    icon: "fa-map-marker-alt",
    id: 3,
    name: "Turístico",
  },
  {
    description: "Combina alta demanda y características turísticas.",
    icon: "fa-th-large",
    id: 4,
    name: "Mixto",
  },
  {
    description: "Servicios exclusivos como valet, seguridad reforzada y comodidades superiores.",
    icon: "fa-crown",
    id: 5,
    name: "Premium",
  },
];

const fallbackServices: PublishParkingService[] = [
  { icon: "fa-video", id: 1, name: "Cámaras" },
  { icon: "fa-shield-alt", id: 2, name: "Vigilancia" },
  { icon: "fa-restroom", id: 4, name: "Sanitarios" },
  { icon: "fa-wifi", id: 5, name: "Wi-Fi" },
  { icon: "fa-wheelchair", id: 6, name: "Discapacitados" },
  { icon: "fa-car", id: 7, name: "Carwash" },
];

const fallbackRestrictions: PublishParkingRestriction[] = [
  { id: 1, name: "No fumar" },
  { id: 2, name: "No tirar basura" },
  { id: 3, name: "No comida" },
  { id: 4, name: "Sólo mayores 18+" },
  { id: 8, name: "No mascotas" },
];

const fallbackVehicleTypes: PublishParkingVehicleType[] = [
  {
    categoryKey: "moto",
    categoryName: "Motocicletas",
    description: "Scooters, motocicletas estándar y grandes",
    icon: "motorcycle",
    id: 1,
  },
  {
    categoryKey: "auto_pequeno",
    categoryName: "Autos Pequeños",
    description: "Sedanes compactos, hatchbacks, subcompactos",
    icon: "car",
    id: 2,
  },
  {
    categoryKey: "auto_mediano",
    categoryName: "Autos Medianos",
    description: "Sedanes familiares, crossovers pequeños",
    icon: "car-side",
    id: 3,
  },
  {
    categoryKey: "pickup",
    categoryName: "Pickups/Furgonetas",
    description: "Pickups pequeñas/grandes, furgonetas",
    icon: "truck-pickup",
    id: 5,
  },
  {
    categoryKey: "bici",
    categoryName: "Bicicletas",
    description: "Bicis, triciclos y uniciclos se incluyen",
    icon: "bicycle",
    id: 9,
  },
];

function normalizeLookup(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function resolveCategoryIcon(name: string) {
  const normalized = normalizeLookup(name);
  const iconByCategory: Record<string, string> = {
    altademanda: "fa-car-alt",
    mixto: "fa-th-large",
    normal: "fa-car",
    premium: "fa-crown",
    turistico: "fa-map-marker-alt",
  };

  return iconByCategory[normalized] ?? "fa-car";
}

function normalizeServiceIcon(value: string | null | undefined) {
  const icon = value?.trim();

  if (!icon) {
    return "fa-check-circle";
  }

  return icon.startsWith("fa-") ? icon : `fa-${icon}`;
}

function mapCatalogRowToCategory(row: PublishParkingCatalogRow): PublishParkingCategory {
  const name = row.name ?? "Normal";

  return {
    description: row.description ?? "",
    icon: resolveCategoryIcon(name),
    id: row.id,
    name,
  };
}

function mapCatalogRowToService(row: PublishParkingCatalogRow): PublishParkingService {
  return {
    icon: normalizeServiceIcon(row.icon),
    id: row.id,
    name: row.name ?? "Servicio",
  };
}

function mapCatalogRowToRestriction(row: PublishParkingCatalogRow): PublishParkingRestriction {
  return {
    id: row.id,
    name: row.name ?? "Restricción",
  };
}

function mapCatalogRowToVehicleType(row: PublishParkingCatalogRow): PublishParkingVehicleType {
  return {
    categoryKey: row.category_key ?? String(row.id),
    categoryName: row.category_name ?? "Vehículo",
    description: row.description ?? "",
    icon: row.icon ?? "car",
    id: row.id,
  };
}

function parseNumber(value: FormDataEntryValue | null, fallback = 0) {
  if (typeof value !== "string") {
    return fallback;
  }

  const parsed = Number(value.replace(",", ".").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parsePositiveInteger(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseBoolean(value: FormDataEntryValue | null) {
  return value === "1" || value === "true" || value === "on";
}

function toDatabaseFlag(value: boolean) {
  return value ? 1 : 0;
}

function getFirstFormValue(formData: FormData, names: string[]) {
  for (const name of names) {
    const value = formData.get(name);

    if (value !== null) {
      return value;
    }
  }

  return null;
}

function getAllFormValues(formData: FormData, names: string[]) {
  return names.flatMap((name) => formData.getAll(name));
}

function parseCsv(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseScheduleDraft(rawValue: FormDataEntryValue | null) {
  if (typeof rawValue !== "string" || !rawValue.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as {
      is_24_7?: boolean;
      is24_7?: boolean;
      schedule?: Partial<Record<ParkingDayKey, ScheduleDraftDay>>;
    };

    return {
      is24_7: Boolean(parsed.is_24_7 ?? parsed.is24_7),
      schedule: parsed.schedule ?? {},
    };
  } catch {
    return null;
  }
}

function parseLegacyFeeEntries(entries: FormDataEntryValue[]) {
  return entries
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.split("|").map((part) => part.trim()))
    .filter((parts) => parts.length >= 5)
    .map(([vehicleType, price, timeUnit, appliesTo, feeType]) => ({
      appliesTo,
      feeType,
      price,
      timeUnit,
      validFrom: null as string | null,
      validTo: null as string | null,
      vehicleType,
      vehicleTypeId: null as number | null,
    }));
}

function parseFeeEntriesFromFormData(formData: FormData) {
  const vehicleTypes = getAllFormValues(formData, ["tarifa_vehicle_type", "tarifa_vehicle_type[]"]);

  if (vehicleTypes.length === 0) {
    return parseLegacyFeeEntries(formData.getAll("tarifa_resumen"));
  }

  const feeTypes = getAllFormValues(formData, ["tarifa_tipo", "tarifa_tipo[]"]);
  const prices = getAllFormValues(formData, ["tarifa_precio", "tarifa_precio[]"]);
  const timeUnits = getAllFormValues(formData, ["tarifa_unidad", "tarifa_unidad[]"]);
  const appliesToValues = getAllFormValues(formData, ["tarifa_dias", "tarifa_dias[]"]);
  const validFromValues = getAllFormValues(formData, [
    "tarifa_validez_inicio",
    "tarifa_validez_inicio[]",
  ]);
  const validToValues = getAllFormValues(formData, [
    "tarifa_validez_fin",
    "tarifa_validez_fin[]",
  ]);

  return vehicleTypes
    .map((entry, index) => {
      if (typeof entry !== "string") {
        return null;
      }

      const priceEntry = prices[index];
      const vehicleType = entry.trim();
      const price = typeof priceEntry === "string" && priceEntry.trim() ? priceEntry.trim() : "Gratis";

      if (!vehicleType) {
        return null;
      }

      return {
        appliesTo:
          typeof appliesToValues[index] === "string" && appliesToValues[index].trim()
            ? String(appliesToValues[index]).trim()
            : "Toda la semana",
        feeType:
          typeof feeTypes[index] === "string" && feeTypes[index].trim()
            ? String(feeTypes[index]).trim()
            : "normal",
        price,
        timeUnit:
          typeof timeUnits[index] === "string" && timeUnits[index].trim()
            ? String(timeUnits[index]).trim()
            : "hora",
        validFrom:
          typeof validFromValues[index] === "string" && validFromValues[index].trim()
            ? String(validFromValues[index]).trim()
            : null,
        validTo:
          typeof validToValues[index] === "string" && validToValues[index].trim()
            ? String(validToValues[index]).trim()
            : null,
        vehicleType,
        vehicleTypeId: parsePositiveInteger(vehicleType),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}

function parsePhysicalSchedule(draft: ReturnType<typeof parseScheduleDraft>) {
  const schedule: Partial<Record<ParkingDayKey, ScheduleSlot[]>> = {};

  if (!draft) {
    return schedule;
  }

  if (draft.is24_7) {
    const allDays: ParkingDayKey[] = [
      "lunes",
      "martes",
      "miercoles",
      "jueves",
      "viernes",
      "sabado",
      "domingo",
    ];

    allDays.forEach((day) => {
      schedule[day] = [{ apertura: "00:00", cierre: "23:59" }];
    });

    return schedule;
  }

  for (const [day, dayValue] of Object.entries(draft.schedule) as Array<
    [ParkingDayKey, ScheduleDraftDay]
  >) {
    if (!dayValue.enabled) {
      schedule[day] = [];
      continue;
    }

    const slots =
      dayValue.slots && dayValue.slots.length > 0
        ? dayValue.slots
        : [{ open: dayValue.open ?? "", close: dayValue.close ?? "" }];

    schedule[day] = slots
      .filter((slot) => slot.open && slot.close)
      .map((slot) => ({ apertura: slot.open, cierre: slot.close }));
  }

  return schedule;
}

async function ensureStorageBucket(admin: ReturnType<typeof createSupabaseAdminClient>) {
  const bucketName = getParkingBucketName();
  const { error } = await admin.storage.createBucket(bucketName, {
    allowedMimeTypes: Object.keys(allowedImageTypes),
    fileSizeLimit: MAX_IMAGE_SIZE,
    public: true,
  });

  if (error && !/exists|duplicate/i.test(error.message)) {
    throw error;
  }
}

async function loadCatalogRows(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  table: "parking_categories" | "vehicle_types" | "services" | "restriction_types",
) {
  const selectByTable = {
    parking_categories: "id, name, description",
    restriction_types: "id, name",
    services: "id, name, icon",
    vehicle_types: "id, category_key, category_name, icon, description",
  } satisfies Record<typeof table, string>;
  const { data, error } = await admin.from(table).select(selectByTable[table]).order("id");

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as PublishParkingCatalogRow[];
}

export async function getPublishParkingCatalog(): Promise<PublishParkingCatalog> {
  try {
    const admin = createSupabaseAdminClient();
    const [categories, services, restrictions, vehicleTypes] = await Promise.all([
      loadCatalogRows(admin, "parking_categories"),
      loadCatalogRows(admin, "services"),
      loadCatalogRows(admin, "restriction_types"),
      loadCatalogRows(admin, "vehicle_types"),
    ]);

    return {
      categories:
        categories.length > 0 ? categories.map(mapCatalogRowToCategory) : fallbackCategories,
      restrictions:
        restrictions.length > 0 ? restrictions.map(mapCatalogRowToRestriction) : fallbackRestrictions,
      services: services.length > 0 ? services.map(mapCatalogRowToService) : fallbackServices,
      vehicleTypes:
        vehicleTypes.length > 0 ? vehicleTypes.map(mapCatalogRowToVehicleType) : fallbackVehicleTypes,
    };
  } catch (error) {
    console.warn("Failed to load publish parking catalog.", formatSupabaseErrorForLog(error));

    return {
      categories: fallbackCategories,
      restrictions: fallbackRestrictions,
      services: fallbackServices,
      vehicleTypes: fallbackVehicleTypes,
    };
  }
}

function resolveCatalogRow(
  rows: PublishParkingCatalogRow[],
  value: string,
  options: string[] = [],
) {
  const numericId = parsePositiveInteger(value);

  if (numericId) {
    return rows.find((row) => row.id === numericId) ?? null;
  }

  const lookupValues = [value, ...options].map(normalizeLookup);

  return (
    rows.find((row) => {
      const rowName = normalizeLookup(row.name ?? row.category_name ?? "");
      return lookupValues.includes(rowName);
    }) ?? null
  );
}

function resolveVehicleTypeRow(rows: PublishParkingCatalogRow[], value: string) {
  const normalized = normalizeLookup(value);
  const aliases: Record<string, string[]> = {
    auto: ["auto", "autospequenos", "autosmedianos", "autosgrandes", "car", "sedan"],
    bicicleta: ["bicicleta", "bicicletas", "bike", "bicycle"],
    microbus: ["microbus", "microbús", "vehiculoscomerciales", "van"],
    motocicleta: ["motocicleta", "motocicletas", "moto", "motorcycle"],
    pickup: ["pickup", "pickupsfurgonetas", "camioneta"],
  };

  const aliasList = aliases[normalized] ?? [normalized];
  return resolveCatalogRow(rows, value, aliasList);
}

function resolveServiceRow(rows: PublishParkingCatalogRow[], value: string) {
  const normalized = normalizeLookup(value);
  const aliases: Record<string, string[]> = {
    accesibilidad: ["accesibilidad", "discapacitados"],
    "cargaelectrica": ["cargaelectrica", "cargaparaautoselectricos"],
    camaras: ["camaras"],
  };

  return resolveCatalogRow(rows, value, aliases[normalized] ?? [normalized]);
}

function normalizeTimeUnitForDatabase(value: string) {
  const normalized = normalizeLookup(value);

  if (normalized === "dia") {
    return "día";
  }

  if (normalized === "ano") {
    return "año";
  }

  return value || "hora";
}

function normalizeAppliesToForDatabase(value: string) {
  const normalized = normalizeLookup(value);

  if (normalized === "diaslaborales") {
    return "Días laborales";
  }

  if (normalized === "finesdesemana") {
    return "Fines de semana";
  }

  return "Toda la semana";
}

function parseVehicleCapacityEntries(
  formData: FormData,
  vehicleTypes: PublishParkingCatalogRow[],
  reservableCapacity: number,
) {
  let remainingReservable = reservableCapacity;

  return vehicleTypes
    .map((vehicleType) => {
      const capacity = parseNumber(formData.get(`capacidad_vehiculo[${vehicleType.id}]`));
      const reservable = Math.min(capacity, Math.max(remainingReservable, 0));
      remainingReservable -= reservable;

      return {
        capacity,
        reservable,
        vehicleTypeId: vehicleType.id,
      };
    })
    .filter((entry) => entry.capacity > 0 || entry.reservable > 0);
}

async function uploadParkingImages(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  ownerId: number,
  parkingId: number,
  files: File[],
) {
  const bucketName = getParkingBucketName();
  const uploadedImages: PublishParkingImage[] = [];

  for (const [index, file] of files.entries()) {
    const extension = allowedImageTypes[file.type];

    if (!extension) {
      throw new Error(`El archivo ${file.name} no es una imagen válida.`);
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error(`La imagen ${file.name} es demasiado grande (máximo 5MB).`);
    }

    const filePath = `${ownerId}/${parkingId}/${Date.now()}-${index}-${randomUUID()}.${extension}`;
    const uploadResult = await admin.storage.from(bucketName).upload(filePath, Buffer.from(await file.arrayBuffer()), {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true,
    });

    if (uploadResult.error) {
      throw uploadResult.error;
    }

    const { data } = admin.storage.from(bucketName).getPublicUrl(filePath);
    uploadedImages.push({ path: filePath, url: data.publicUrl });
  }

  return uploadedImages;
}

async function cleanupCreatedParking(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  created: {
    images: PublishParkingImage[];
    locationId?: number;
    parkingId?: number;
  },
) {
  for (const image of created.images) {
    await admin.storage.from(getParkingBucketName()).remove([image.path]);
  }

  if (created.parkingId) {
    await admin.from("parking_images").delete().eq("parking_id", created.parkingId);
    await admin.from("parking_fees").delete().eq("parking_id", created.parkingId);
    await admin.from("parking_services").delete().eq("parking_id", created.parkingId);
    await admin.from("parking_restriction_items").delete().eq("parking_id", created.parkingId);
    await admin.from("parking_vehicle_capacities").delete().eq("parking_id", created.parkingId);
    await admin.from("parking_capacities").delete().eq("parking_id", created.parkingId);
    await admin.from("parking_restrictions").delete().eq("parking_id", created.parkingId);
    await admin.from("parkings").delete().eq("id", created.parkingId);
  }

  if (created.locationId) {
    await admin.from("locations").delete().eq("id", created.locationId);
  }
}

async function insertRequiredRow(query: unknown) {
  const result = (await query) as { data: { id: number } | null; error: { message: string } | null };

  if (result.error) {
    throw new Error(result.error.message);
  }

  if (!result.data) {
    throw new Error("No se pudo guardar la informacion del parqueo.");
  }

  return result.data;
}

export async function publishParkingFromFormData(sessionUser: SessionUser, formData: FormData): Promise<PublishParkingResult> {
  const admin = createSupabaseAdminClient();

  const parkingName = String(formData.get("nombre") ?? "").trim();
  const description = String(formData.get("descripcion") ?? "").trim();
  const categoryId = String(formData.get("categoria_id") ?? "").trim();
  const department = String(formData.get("departamento") ?? "").trim();
  const municipality = String(formData.get("municipio") ?? "").trim();
  const streetAddress = String(formData.get("direccion") ?? "").trim();
  const referenceAddress = String(formData.get("referencia") ?? "").trim();
  const wazeLink = String(formData.get("waze_link") ?? "").trim();
  const googleMapsLink = String(formData.get("google_maps_link") ?? "").trim();
  const scheduleDraft = parseScheduleDraft(formData.get("schedule_json"));
  const schedule = parsePhysicalSchedule(scheduleDraft);
  const is24_7 = parseBoolean(formData.get("is_24_7")) || Boolean(scheduleDraft?.is24_7);
  const services = parseCsv(formData.get("servicios"));
  const restrictions = parseCsv(formData.get("restricciones"));
  const capacityGeneral = parseNumber(formData.get("capacidad_general"));
  const rawReservableCapacity = formData.get("reservable_capacity");
  const reservableCapacity =
    rawReservableCapacity === null
      ? capacityGeneral
      : Math.max(0, parseNumber(rawReservableCapacity));
  const disabilitySpaces = parseNumber(formData.get("espacios_discapacitados"));
  const contactName = String(formData.get("contacto_nombre") ?? sessionUser.fullName).trim();
  const contactPhone = String(formData.get("contacto_telefono") ?? sessionUser.phoneNumber ?? "").trim();
  const contactEmail = String(formData.get("contacto_email") ?? sessionUser.email).trim();
  const businessName = String(formData.get("business_name") ?? contactName).trim();
  const maxHeight = parseNumber(formData.get("altura_maxima"));
  const maxSpeed = parseNumber(formData.get("velocidad_maxima"));
  const feeEntries = parseFeeEntriesFromFormData(formData);
  const imageFiles = getAllFormValues(formData, ["imagenes", "imagenes[]"])
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const primaryImageIndex = Math.max(
    0,
    Math.min(
      Math.floor(parseNumber(getFirstFormValue(formData, ["imagen_principal"]), 0)),
      Math.max(imageFiles.length - 1, 0),
    ),
  );

  if (
    !parkingName ||
    !description ||
    !categoryId ||
    !department ||
    !municipality ||
    !streetAddress ||
    !contactName ||
    !contactPhone ||
    !contactEmail ||
    capacityGeneral <= 0
  ) {
    throw new Error("Completa la informacion basica antes de publicar.");
  }

  if (imageFiles.length === 0) {
    throw new Error("Debe subir al menos una imagen del parqueo.");
  }

  if (imageFiles.length > MAX_IMAGE_COUNT) {
    throw new Error(`Solo puedes subir un máximo de ${MAX_IMAGE_COUNT} imágenes.`);
  }

  for (const file of imageFiles) {
    if (!allowedImageTypes[file.type]) {
      throw new Error(`El archivo ${file.name} no es una imagen válida.`);
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error(`La imagen ${file.name} es demasiado grande (máximo 5MB).`);
    }
  }

  const [categories, vehicleTypes, serviceRows, restrictionRows] = await Promise.all([
    loadCatalogRows(admin, "parking_categories"),
    loadCatalogRows(admin, "vehicle_types"),
    loadCatalogRows(admin, "services"),
    loadCatalogRows(admin, "restriction_types"),
  ]);

  const category = resolveCatalogRow(categories, categoryId);

  if (!category) {
    throw new Error("La categoria seleccionada no existe en Supabase.");
  }

  const vehicleCapacityEntries = parseVehicleCapacityEntries(
    formData,
    vehicleTypes,
    reservableCapacity,
  );

  const created = {
    images: [] as PublishParkingImage[],
    locationId: undefined as number | undefined,
    parkingId: undefined as number | undefined,
  };

  try {
    const { data: updatedUser, error: userUpdateError } = await admin
      .from("users")
      .update({ business_name: businessName || null })
      .eq("id", sessionUser.id)
      .select("id")
      .maybeSingle();

    if (userUpdateError) {
      throw userUpdateError;
    }

    if (!updatedUser) {
      throw new Error("No se encontro el perfil del propietario.");
    }

    const location = await insertRequiredRow(
      admin
        .from("locations")
        .insert({
          department,
          google_maps_link: googleMapsLink,
          latitude: null,
          longitude: null,
          municipality,
          reference_address: referenceAddress,
          street_address: streetAddress,
          waze_link: wazeLink,
        })
        .select("id")
        .single(),
    );

    created.locationId = location.id;

    const parking = await insertRequiredRow(
      admin
        .from("parkings")
        .insert({
          category_id: category.id,
          contact_email: contactEmail,
          contact_name: contactName,
          contact_phone: contactPhone,
          description,
          is_24_7: toDatabaseFlag(is24_7),
          location_id: location.id,
          name: parkingName,
          owner_id: sessionUser.id,
          schedule,
          status: "activo",
        })
        .select("id")
        .single(),
    );

    created.parkingId = parking.id;

    await ensureStorageBucket(admin);

    const uploadedImages = await uploadParkingImages(admin, sessionUser.id, parking.id, imageFiles);
    created.images.push(...uploadedImages);

    const imageRows = uploadedImages.map((image, index) => ({
      image_url: image.url,
      is_primary: toDatabaseFlag(index === primaryImageIndex),
      sort_order: index + 1,
    }));

    if (imageRows.length > 0) {
      const { error: imageInsertError } = await admin.from("parking_images").insert(
        imageRows.map((image) => ({
          image_url: image.image_url,
          is_primary: image.is_primary,
          parking_id: parking.id,
          sort_order: image.sort_order,
        })),
      );

      if (imageInsertError) {
        throw imageInsertError;
      }
    }

    const { error: capacityError } = await admin
      .from("parking_capacities")
      .insert({
        disability_spaces: disabilitySpaces,
        general_capacity: capacityGeneral,
        pregnant_people_spaces: 0,
        reservable_capacity: reservableCapacity,
        taxi_spaces: 0,
        parking_id: parking.id,
      });

    if (capacityError) {
      throw capacityError;
    }

    const restrictionRowsPayload = restrictions
      .map((restriction) => resolveCatalogRow(restrictionRows, restriction))
      .filter((row): row is PublishParkingCatalogRow => Boolean(row));

    if (maxHeight > 0 || maxSpeed > 0) {
      const { error: restrictionError } = await admin
        .from("parking_restrictions")
        .insert({
          max_height: maxHeight || null,
          max_speed: maxSpeed || null,
          parking_id: parking.id,
        });

      if (restrictionError) {
        throw restrictionError;
      }
    }

    if (restrictionRowsPayload.length > 0) {
      const { error: restrictionItemsError } = await admin.from("parking_restriction_items").insert(
        restrictionRowsPayload.map((restriction) => ({
          parking_id: parking.id,
          restriction_type_id: restriction.id,
        })),
      );

      if (restrictionItemsError) {
        throw restrictionItemsError;
      }
    }

    const serviceRowsPayload = services
      .map((service) => resolveServiceRow(serviceRows, service))
      .filter((row): row is PublishParkingCatalogRow => Boolean(row));

    if (serviceRowsPayload.length > 0) {
      const { error: serviceInsertError } = await admin.from("parking_services").insert(
        serviceRowsPayload.map((service) => ({
          parking_id: parking.id,
          service_id: service.id,
        })),
      );

      if (serviceInsertError) {
        throw serviceInsertError;
      }
    }

    const vehicleRowsPayload = feeEntries
      .map((fee) => ({
        ...fee,
        vehicleTypeRow:
          fee.vehicleTypeId !== null
            ? vehicleTypes.find((vehicleType) => vehicleType.id === fee.vehicleTypeId) ?? null
            : resolveVehicleTypeRow(vehicleTypes, fee.vehicleType),
      }))
      .filter((entry): entry is (typeof feeEntries)[number] & { vehicleTypeRow: PublishParkingCatalogRow } =>
        Boolean(entry.vehicleTypeRow),
      );

    if (vehicleRowsPayload.length > 0) {
      const { error: feesError } = await admin.from("parking_fees").insert(
        vehicleRowsPayload.map((fee) => ({
          applies_to: normalizeAppliesToForDatabase(fee.appliesTo),
          fee_type: fee.feeType,
          parking_id: parking.id,
          price: fee.price,
          time_unit: normalizeTimeUnitForDatabase(fee.timeUnit),
          vehicle_type_id: fee.vehicleTypeRow.id,
          valid_from: fee.validFrom,
          valid_to: fee.validTo,
        })),
      );

      if (feesError) {
        throw feesError;
      }
    }

    const resolvedVehicleCapacityEntries =
      vehicleCapacityEntries.length > 0
        ? vehicleCapacityEntries
        : vehicleRowsPayload.length > 0
          ? [
              {
                capacity: capacityGeneral,
                reservable: reservableCapacity,
                vehicleTypeId: vehicleRowsPayload[0].vehicleTypeRow.id,
              },
            ]
          : [];

    if (resolvedVehicleCapacityEntries.length > 0) {
      const { error: capacitiesError } = await admin.from("parking_vehicle_capacities").insert(
        resolvedVehicleCapacityEntries.map((entry) => ({
          capacity: entry.capacity,
          parking_id: parking.id,
          reservable_vehicle_c: entry.reservable,
          vehicle_type_id: entry.vehicleTypeId,
        })),
      );

      if (capacitiesError) {
        throw capacitiesError;
      }
    }

    return { parkingId: parking.id };
  } catch (error) {
    await cleanupCreatedParking(admin, created);
    throw error;
  }
}

type ParkingImageRecord = {
  id: number;
  image_url: string;
};

function parseEditImageFlag(value: FormDataEntryValue | null) {
  return parseBoolean(value);
}

async function loadOwnedParking(parkingId: number, ownerId: number) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("parkings")
    .select("id, owner_id, location_id")
    .eq("id", parkingId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const parking = data as { id: number; location_id: number | null; owner_id: number } | null;

  if (!parking) {
    return {
      parking: null,
      status: 404,
    };
  }

  if (parking.owner_id !== ownerId) {
    return {
      parking: null,
      status: 403,
    };
  }

  return {
    parking,
    status: 200,
  };
}

async function loadParkingImages(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  parkingId: number,
) {
  const { data, error } = await admin.from("parking_images").select("id, image_url").eq("parking_id", parkingId);

  if (error) {
    throw error;
  }

  return (data ?? []) as ParkingImageRecord[];
}

function extractStoragePathFromPublicUrl(publicUrl: string) {
  const bucketName = getParkingBucketName();
  const marker = `/storage/v1/object/public/${bucketName}/`;
  const markerIndex = publicUrl.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  return decodeURIComponent(publicUrl.slice(markerIndex + marker.length));
}

async function deleteParkingImageFiles(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  images: ParkingImageRecord[],
) {
  const bucketName = getParkingBucketName();
  const paths = images
    .map((image) => extractStoragePathFromPublicUrl(image.image_url))
    .filter((path): path is string => Boolean(path));

  if (paths.length > 0) {
    const { error } = await admin.storage.from(bucketName).remove(paths);

    if (error) {
      throw error;
    }
  }
}

async function updateParkingCapacity(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  parkingId: number,
  values: {
    disabilitySpaces: number;
    generalCapacity: number;
    pregnantSpaces: number;
    reservableCapacity: number;
    taxiSpaces: number;
  },
) {
  const { data, error } = await admin
    .from("parking_capacities")
    .select("id")
    .eq("parking_id", parkingId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data?.id) {
    const { error: updateError } = await admin
      .from("parking_capacities")
      .update({
        disability_spaces: values.disabilitySpaces,
        general_capacity: values.generalCapacity,
        pregnant_people_spaces: values.pregnantSpaces,
        reservable_capacity: values.reservableCapacity,
        taxi_spaces: values.taxiSpaces,
      })
      .eq("id", data.id);

    if (updateError) {
      throw updateError;
    }

    return;
  }

  const { error: insertError } = await admin.from("parking_capacities").insert({
    disability_spaces: values.disabilitySpaces,
    general_capacity: values.generalCapacity,
    parking_id: parkingId,
    pregnant_people_spaces: values.pregnantSpaces,
    reservable_capacity: values.reservableCapacity,
    taxi_spaces: values.taxiSpaces,
  });

  if (insertError) {
    throw insertError;
  }
}

async function updateParkingRestrictions(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  parkingId: number,
  values: { maxHeight: number; maxSpeed: number; restrictionIds: number[] },
) {
  const { data: restrictionRow, error: restrictionLoadError } = await admin
    .from("parking_restrictions")
    .select("id")
    .eq("parking_id", parkingId)
    .maybeSingle();

  if (restrictionLoadError) {
    throw restrictionLoadError;
  }

  const hasPhysicalRestriction = values.maxHeight > 0 || values.maxSpeed > 0;

  if (!hasPhysicalRestriction && restrictionRow?.id) {
    const { error: deleteRestrictionItemsError } = await admin
      .from("parking_restriction_items")
      .delete()
      .eq("parking_id", parkingId);

    if (deleteRestrictionItemsError) {
      throw deleteRestrictionItemsError;
    }

    const { error: deleteRestrictionError } = await admin
      .from("parking_restrictions")
      .delete()
      .eq("id", restrictionRow.id);

    if (deleteRestrictionError) {
      throw deleteRestrictionError;
    }

    return;
  }

  if (hasPhysicalRestriction) {
    if (restrictionRow?.id) {
      const { error: updateRestrictionError } = await admin
        .from("parking_restrictions")
        .update({
          max_height: values.maxHeight || null,
          max_speed: values.maxSpeed || null,
        })
        .eq("id", restrictionRow.id);

      if (updateRestrictionError) {
        throw updateRestrictionError;
      }
    } else {
      const { error: insertRestrictionError } = await admin.from("parking_restrictions").insert({
        max_height: values.maxHeight || null,
        max_speed: values.maxSpeed || null,
        parking_id: parkingId,
      });

      if (insertRestrictionError) {
        throw insertRestrictionError;
      }
    }
  }

  const { error: deleteRestrictionItemsError } = await admin
    .from("parking_restriction_items")
    .delete()
    .eq("parking_id", parkingId);

  if (deleteRestrictionItemsError) {
    throw deleteRestrictionItemsError;
  }

  if (values.restrictionIds.length > 0) {
    const { error: insertRestrictionItemsError } = await admin.from("parking_restriction_items").insert(
      values.restrictionIds.map((restrictionId) => ({
        parking_id: parkingId,
        restriction_type_id: restrictionId,
      })),
    );

    if (insertRestrictionItemsError) {
      throw insertRestrictionItemsError;
    }
  }
}

async function updateParkingServices(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  parkingId: number,
  serviceIds: number[],
) {
  const { error: deleteServicesError } = await admin.from("parking_services").delete().eq("parking_id", parkingId);

  if (deleteServicesError) {
    throw deleteServicesError;
  }

  if (serviceIds.length > 0) {
    const { error: insertServicesError } = await admin.from("parking_services").insert(
      serviceIds.map((serviceId) => ({
        parking_id: parkingId,
        service_id: serviceId,
      })),
    );

    if (insertServicesError) {
      throw insertServicesError;
    }
  }
}

async function updateParkingFees(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  parkingId: number,
  entries: Array<{
    appliesTo: string;
    feeType: string;
    price: string;
    timeUnit: string;
    validFrom: string | null;
    validTo: string | null;
    vehicleTypeId: number | null;
    vehicleType: string;
  }>,
  vehicleTypes: PublishParkingCatalogRow[],
) {
  const { error: deleteFeesError } = await admin.from("parking_fees").delete().eq("parking_id", parkingId);

  if (deleteFeesError) {
    throw deleteFeesError;
  }

  const rows = entries
    .map((fee) => ({
      ...fee,
      vehicleTypeRow:
        fee.vehicleTypeId !== null
          ? vehicleTypes.find((vehicleType) => vehicleType.id === fee.vehicleTypeId) ?? null
          : resolveVehicleTypeRow(vehicleTypes, fee.vehicleType),
    }))
    .filter((entry): entry is (typeof entries)[number] & { vehicleTypeRow: PublishParkingCatalogRow } =>
      Boolean(entry.vehicleTypeRow),
    );

  if (rows.length === 0) {
    return;
  }

  const { error: insertFeesError } = await admin.from("parking_fees").insert(
    rows.map((fee) => ({
      applies_to: normalizeAppliesToForDatabase(fee.appliesTo),
      fee_type: fee.feeType,
      parking_id: parkingId,
      price: fee.price,
      time_unit: normalizeTimeUnitForDatabase(fee.timeUnit),
      vehicle_type_id: fee.vehicleTypeRow.id,
      valid_from: fee.validFrom,
      valid_to: fee.validTo,
    })),
  );

  if (insertFeesError) {
    throw insertFeesError;
  }
}

async function updateVehicleCapacities(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  parkingId: number,
  entries: Array<{
    capacity: number;
    reservable: number;
    vehicleTypeId: number;
  }>,
) {
  const { error: deleteCapacitiesError } = await admin
    .from("parking_vehicle_capacities")
    .delete()
    .eq("parking_id", parkingId);

  if (deleteCapacitiesError) {
    throw deleteCapacitiesError;
  }

  if (entries.length === 0) {
    return;
  }

  const { error: insertCapacitiesError } = await admin.from("parking_vehicle_capacities").insert(
    entries.map((entry) => ({
      capacity: entry.capacity,
      parking_id: parkingId,
      reservable_vehicle_c: entry.reservable,
      vehicle_type_id: entry.vehicleTypeId,
    })),
  );

  if (insertCapacitiesError) {
    throw insertCapacitiesError;
  }
}

async function replaceParkingImages(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  ownerId: number,
  parkingId: number,
  files: File[],
  primaryImageIndex: number,
) {
  const uploadedImages = await uploadParkingImages(admin, ownerId, parkingId, files);
  const imageRows = uploadedImages.map((image, index) => ({
    image_url: image.url,
    is_primary: toDatabaseFlag(index === primaryImageIndex),
    sort_order: index + 1,
  }));

  if (imageRows.length > 0) {
    const { error: imageInsertError } = await admin.from("parking_images").insert(
      imageRows.map((image) => ({
        image_url: image.image_url,
        is_primary: image.is_primary,
        parking_id: parkingId,
        sort_order: image.sort_order,
      })),
    );

    if (imageInsertError) {
      for (const image of uploadedImages) {
        await admin.storage.from(getParkingBucketName()).remove([image.path]);
      }

      throw imageInsertError;
    }
  }
}

export async function updateParkingFromFormData(
  sessionUser: SessionUser,
  formData: FormData,
): Promise<PublishParkingResult> {
  const admin = createSupabaseAdminClient();
  const parkingId = parsePositiveInteger(String(formData.get("parking_id") ?? ""));

  if (!parkingId) {
    throw new Error("Parqueo invalido.");
  }

  const parkingName = String(formData.get("nombre") ?? "").trim();
  const description = String(formData.get("descripcion") ?? "").trim();
  const categoryId = String(formData.get("categoria_id") ?? "").trim();
  const department = String(formData.get("departamento") ?? "").trim();
  const municipality = String(formData.get("municipio") ?? "").trim();
  const streetAddress = String(formData.get("direccion") ?? "").trim();
  const referenceAddress = String(formData.get("referencia") ?? "").trim();
  const wazeLink = String(formData.get("waze_link") ?? "").trim();
  const googleMapsLink = String(formData.get("google_maps_link") ?? "").trim();
  const scheduleDraft = parseScheduleDraft(formData.get("schedule_json"));
  const schedule = parsePhysicalSchedule(scheduleDraft);
  const is24_7 = parseBoolean(formData.get("is_24_7")) || Boolean(scheduleDraft?.is24_7);
  const services = parseCsv(formData.get("servicios"));
  const restrictions = parseCsv(formData.get("restricciones"));
  const capacityGeneral = parseNumber(formData.get("capacidad_general"));
  const rawReservableCapacity = formData.get("reservable_capacity");
  const reservableCapacity =
    rawReservableCapacity === null
      ? capacityGeneral
      : Math.max(0, parseNumber(rawReservableCapacity));
  const disabilitySpaces = parseNumber(formData.get("espacios_discapacitados"));
  const pregnantSpaces = parseNumber(formData.get("espacios_embarazadas"));
  const taxiSpaces = parseNumber(formData.get("espacios_taxi"));
  const contactName = String(formData.get("contacto_nombre") ?? sessionUser.fullName).trim();
  const contactPhone = String(formData.get("contacto_telefono") ?? sessionUser.phoneNumber ?? "").trim();
  const contactEmail = String(formData.get("contacto_email") ?? sessionUser.email).trim();
  const businessName = String(formData.get("business_name") ?? contactName).trim();
  const maxHeight = parseNumber(formData.get("altura_maxima"));
  const maxSpeed = parseNumber(formData.get("velocidad_maxima"));
  const clearExistingImages = parseEditImageFlag(formData.get("clear_existing_images"));
  const feeEntries = parseFeeEntriesFromFormData(formData);
  const imageFiles = getAllFormValues(formData, ["imagenes", "imagenes[]"])
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const primaryImageIndex = Math.max(
    0,
    Math.min(
      Math.floor(parseNumber(getFirstFormValue(formData, ["imagen_principal"]), 0)),
      Math.max(imageFiles.length - 1, 0),
    ),
  );

  if (
    !parkingName ||
    !description ||
    !categoryId ||
    !department ||
    !municipality ||
    !streetAddress ||
    !contactName ||
    !contactPhone ||
    !contactEmail ||
    capacityGeneral <= 0
  ) {
    throw new Error("Completa la informacion principal del parqueo.");
  }

  if (imageFiles.length > MAX_IMAGE_COUNT) {
    throw new Error(`Solo puedes subir un máximo de ${MAX_IMAGE_COUNT} imágenes.`);
  }

  for (const file of imageFiles) {
    if (!allowedImageTypes[file.type]) {
      throw new Error(`El archivo ${file.name} no es una imagen válida.`);
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error(`La imagen ${file.name} es demasiado grande (máximo 5MB).`);
    }
  }

  const [ownership, categories, vehicleTypes, serviceRows, restrictionRows] = await Promise.all([
    loadOwnedParking(parkingId, sessionUser.id),
    loadCatalogRows(admin, "parking_categories"),
    loadCatalogRows(admin, "vehicle_types"),
    loadCatalogRows(admin, "services"),
    loadCatalogRows(admin, "restriction_types"),
  ]);

  if (!ownership.parking) {
    throw new Error(
      ownership.status === 403 ? "No puedes editar este parqueo." : "No se encontro el parqueo.",
    );
  }

  const category = resolveCatalogRow(categories, categoryId);

  if (!category) {
    throw new Error("La categoria seleccionada no existe en Supabase.");
  }

  const vehicleCapacityEntries = parseVehicleCapacityEntries(
    formData,
    vehicleTypes,
    reservableCapacity,
  );
  const resolvedServiceRows = services
    .map((service) => resolveServiceRow(serviceRows, service))
    .filter((row): row is PublishParkingCatalogRow => Boolean(row));
  const resolvedRestrictionRows = restrictions
    .map((restriction) => resolveCatalogRow(restrictionRows, restriction))
    .filter((row): row is PublishParkingCatalogRow => Boolean(row));
  const feeRows = feeEntries;
  const currentImages = imageFiles.length > 0 || clearExistingImages ? await loadParkingImages(admin, parkingId) : [];

  try {
    const { data: updatedUser, error: userUpdateError } = await admin
      .from("users")
      .update({ business_name: businessName || null })
      .eq("id", sessionUser.id)
      .select("id")
      .maybeSingle();

    if (userUpdateError) {
      throw userUpdateError;
    }

    if (!updatedUser) {
      throw new Error("No se encontro el perfil del propietario.");
    }

    if (ownership.parking.location_id) {
      const { error: locationError } = await admin
        .from("locations")
        .update({
          department,
          google_maps_link: googleMapsLink,
          municipality,
          reference_address: referenceAddress || null,
          street_address: streetAddress,
          waze_link: wazeLink,
        })
        .eq("id", ownership.parking.location_id);

      if (locationError) {
        throw locationError;
      }
    } else {
      const location = await insertRequiredRow(
        admin
          .from("locations")
          .insert({
            department,
            google_maps_link: googleMapsLink,
            latitude: null,
            longitude: null,
            municipality,
            reference_address: referenceAddress,
            street_address: streetAddress,
            waze_link: wazeLink,
          })
          .select("id")
          .single(),
      );

      const { error: parkingLocationError } = await admin
        .from("parkings")
        .update({ location_id: location.id })
        .eq("id", parkingId);

      if (parkingLocationError) {
        throw parkingLocationError;
      }
    }

    const { error: parkingError } = await admin
      .from("parkings")
      .update({
        category_id: category.id,
        contact_email: contactEmail,
        contact_name: contactName,
        contact_phone: contactPhone,
        description,
        is_24_7: toDatabaseFlag(is24_7),
        name: parkingName,
        schedule,
      })
      .eq("id", parkingId);

    if (parkingError) {
      throw parkingError;
    }

    await updateParkingCapacity(admin, parkingId, {
      disabilitySpaces,
      generalCapacity: capacityGeneral,
      pregnantSpaces,
      reservableCapacity,
      taxiSpaces,
    });

    await updateParkingRestrictions(admin, parkingId, {
      maxHeight,
      maxSpeed,
      restrictionIds: resolvedRestrictionRows.map((restriction) => restriction.id),
    });

    await updateParkingServices(
      admin,
      parkingId,
      resolvedServiceRows.map((service) => service.id),
    );

    await updateParkingFees(admin, parkingId, feeRows, vehicleTypes);

    await updateVehicleCapacities(
      admin,
      parkingId,
      vehicleCapacityEntries.length > 0
        ? vehicleCapacityEntries
        : feeRows.length > 0
          ? [
              {
                capacity: capacityGeneral,
                reservable: reservableCapacity,
                vehicleTypeId:
                  feeRows[0].vehicleTypeId ??
                  resolveVehicleTypeRow(vehicleTypes, feeRows[0].vehicleType)?.id ??
                  vehicleTypes[0]?.id ??
                  0,
              },
            ].filter((entry) => entry.vehicleTypeId > 0)
          : [],
    );

    if (imageFiles.length > 0) {
      await replaceParkingImages(admin, sessionUser.id, parkingId, imageFiles, primaryImageIndex);
      if (currentImages.length > 0) {
        const { error: deleteRowsError } = await admin.from("parking_images").delete().eq("parking_id", parkingId);
        if (deleteRowsError) {
          console.warn("Failed to clean old parking images.", formatSupabaseErrorForLog(deleteRowsError));
        } else {
          await deleteParkingImageFiles(admin, currentImages);
        }
      }
    } else if (clearExistingImages && currentImages.length > 0) {
      const { error: deleteRowsError } = await admin.from("parking_images").delete().eq("parking_id", parkingId);
      if (deleteRowsError) {
        throw deleteRowsError;
      }
      await deleteParkingImageFiles(admin, currentImages);
    }

    return { parkingId };
  } catch (error) {
    console.error("Failed to update parking.", formatSupabaseErrorForLog(error));
    throw error;
  }
}
