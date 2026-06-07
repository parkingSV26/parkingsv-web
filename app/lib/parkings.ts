import "server-only";

import type {
  Parking,
  ParkingDayKey,
  ParkingFee,
  ParkingReview,
  ScheduleSlot,
  VehicleCapacity,
} from "@/app/parkings/parking-data";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { formatSupabaseErrorForLog } from "@/src/lib/supabase/errors";

type ParkingRecord = {
  category_id: number;
  contact_email: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  description: string;
  id: number;
  is_24_7: boolean | number | null;
  location_id: number;
  locations: LocationRow | LocationRow[] | null;
  name: string;
  owner_id: number;
  parking_capacities: ParkingCapacityRow | ParkingCapacityRow[] | null;
  parking_categories: ParkingCategoryRow | ParkingCategoryRow[] | null;
  parking_fees: ParkingFeeRow[] | null;
  parking_images: ParkingImageRow[] | null;
  parking_restriction_items: ParkingRestrictionItemRow[] | null;
  parking_restrictions: ParkingRestrictionRow | ParkingRestrictionRow[] | null;
  parking_services: ParkingServiceRow[] | null;
  parking_vehicle_capacities: ParkingVehicleCapacityRow[] | null;
  reviews: ParkingReviewRow[] | null;
  schedule: string | Partial<Record<ParkingDayKey, ScheduleSlot[]>> | ScheduleSlot[];
  status: string | null;
};

type LocationRow = {
  department: string;
  google_maps_link: string;
  id: number;
  latitude: number | null;
  longitude: number | null;
  municipality: string;
  reference_address: string;
  street_address: string;
  waze_link: string;
};

type ParkingCapacityRow = {
  disability_spaces: number | null;
  general_capacity: number;
  pregnant_people_spaces: number | null;
  reservable_capacity: number | null;
  taxi_spaces: number | null;
};

type ParkingCategoryRow = {
  description: string;
  id: number;
  name: string;
};

type ParkingFeeRow = {
  applies_to: string | null;
  fee_type: string | null;
  id: number;
  price: string;
  time_unit: string | null;
  valid_from: string | null;
  valid_to: string | null;
  vehicle_types: VehicleTypeRow | VehicleTypeRow[] | null;
};

type ParkingImageRow = {
  id: number;
  image_url: string;
  is_primary: boolean | number | null;
  sort_order: number | null;
};

type ParkingRestrictionItemRow = {
  restriction_type_id: number;
  restriction_types: RestrictionTypeRow | RestrictionTypeRow[] | null;
};

type ParkingRestrictionRow = {
  max_height: number | null;
  max_speed: number | null;
};

type ParkingServiceRow = {
  service_id: number;
  services: ServiceRow | ServiceRow[] | null;
};

type ParkingVehicleCapacityRow = {
  capacity: number;
  reservable_vehicle_c: number | null;
  vehicle_type_id: number;
  vehicle_types: VehicleTypeRow | VehicleTypeRow[] | null;
};

type ParkingReviewRow = {
  comment: string | null;
  created_at: string;
  id: number;
  rating: number;
  user_id: number;
  users: ReviewAuthorRow | ReviewAuthorRow[] | null;
};

type ReviewAuthorRow = {
  full_name: string;
  profile_picture: string | null;
};

type RestrictionTypeRow = {
  id: number;
  name: string;
};

type ServiceRow = {
  icon: string;
  id: number;
  name: string;
};

type VehicleTypeRow = {
  category_name: string;
  icon: string;
  id: number;
};

const LEGACY_PARKING_UPLOAD_PREFIX = "public/uploads/";
const PARKING_SELECT = `
  id,
  owner_id,
  location_id,
  category_id,
  name,
  description,
  schedule,
  is_24_7,
  contact_name,
  contact_phone,
  contact_email,
  status,
  locations(*),
  parking_categories(*),
  parking_images(*),
  parking_capacities(*),
  parking_vehicle_capacities(*, vehicle_types(*)),
  parking_fees(*, vehicle_types(*)),
  parking_services(*, services(*)),
  parking_restrictions(*),
  parking_restriction_items(*, restriction_types(*)),
  reviews(*, users(*))
`;

function asSingle<T>(value: T | T[] | null | undefined) {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function resolveLegacyParkingImage(path: string | null | undefined) {
  if (!path) {
    return "/parkingsv/parking-default.png";
  }

  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/")) {
    return path;
  }

  if (path.startsWith(LEGACY_PARKING_UPLOAD_PREFIX)) {
    return `/legacy-assets/${path.slice(LEGACY_PARKING_UPLOAD_PREFIX.length)}`;
  }

  return `/legacy-assets/${path}`;
}

function normalizeSchedule(
  rawSchedule: ParkingRecord["schedule"],
): Partial<Record<ParkingDayKey, ScheduleSlot[]>> {
  const emptySchedule: Partial<Record<ParkingDayKey, ScheduleSlot[]>> = {};

  if (!rawSchedule) {
    return emptySchedule;
  }

  const parsedSchedule =
    typeof rawSchedule === "string"
      ? (() => {
          try {
            return JSON.parse(rawSchedule) as Partial<Record<ParkingDayKey, ScheduleSlot[]>> | [];
          } catch {
            return emptySchedule;
          }
        })()
      : rawSchedule;

  if (Array.isArray(parsedSchedule)) {
    return emptySchedule;
  }

  return parsedSchedule;
}

function normalizeFeeAppliesTo(value: string | null | undefined): ParkingFee["appliesTo"] {
  if (!value) {
    return "all_week";
  }

  if (/fin/i.test(value)) {
    return "weekends";
  }

  if (/labor/i.test(value)) {
    return "weekdays";
  }

  return "all_week";
}

function normalizeFeeType(value: string | null | undefined): ParkingFee["feeType"] {
  if (value === "evento" || value === "premium" || value === "nocturno") {
    return value;
  }

  return "normal";
}

function normalizeFeeIcon(feeType: ParkingFee["feeType"], vehicleIcon: string | null | undefined) {
  if (feeType === "nocturno") {
    return "moon";
  }

  if (feeType === "evento") {
    return "ticket";
  }

  if (feeType === "premium") {
    return "crown";
  }

  return vehicleIcon || "car";
}

function normalizeFeePrice(value: string) {
  if (/gratis/i.test(value)) {
    return "Gratis";
  }

  return value.startsWith("$") ? value : `$${value}`;
}

function parseComparablePrice(value: string) {
  if (/gratis/i.test(value)) {
    return 0;
  }

  const normalized = value.replace(",", ".").replace(/[^0-9.]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeServiceIcon(value: string) {
  if (value.includes("fa-") && value.includes(" ")) {
    return value;
  }

  if (value.startsWith("fa-")) {
    return `fa-solid ${value}`;
  }

  return `fa-solid fa-${value}`;
}

function resolveCategoryName(categoryName: string) {
  return categoryName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function createParkingId(recordId: number) {
  return String(recordId);
}

function buildParkingReviews(rows: ParkingReviewRow[] | null | undefined): ParkingReview[] {
  return (rows ?? []).map((review) => {
    const author = asSingle(review.users);

    return {
      author: author?.full_name ?? "Usuario Parking SV",
      avatar: resolveLegacyParkingImage(author?.profile_picture),
      comment: review.comment?.trim() ?? "",
      createdAt: review.created_at,
      id: String(review.id),
      rating: review.rating,
    };
  });
}

function buildVehicleCapacities(rows: ParkingVehicleCapacityRow[] | null | undefined): VehicleCapacity[] {
  return (rows ?? [])
    .map((row) => {
      const vehicleType = asSingle(row.vehicle_types);

      if (!vehicleType) {
        return null;
      }

      return {
        capacity: row.capacity,
        categoryName: vehicleType.category_name,
        icon: vehicleType.icon,
        id: vehicleType.id,
        reservableCapacity: row.reservable_vehicle_c ?? 0,
      } satisfies VehicleCapacity;
    })
    .filter((value): value is VehicleCapacity => value !== null);
}

function buildParkingFees(rows: ParkingFeeRow[] | null | undefined): ParkingFee[] {
  return (rows ?? []).map((row) => {
    const vehicleType = asSingle(row.vehicle_types);
    const feeType = normalizeFeeType(row.fee_type);

    return {
      appliesTo: normalizeFeeAppliesTo(row.applies_to),
      feeType,
      icon: normalizeFeeIcon(feeType, vehicleType?.icon),
      id: String(row.id),
      price: normalizeFeePrice(row.price),
      timeUnit: row.time_unit ?? "hora",
      validFrom: row.valid_from,
      validTo: row.valid_to,
      vehicleType: vehicleType?.category_name ?? "General",
    };
  });
}

function buildPriceSummary(fees: ParkingFee[]) {
  return fees
    .slice(0, 3)
    .map((fee) => `${fee.vehicleType} ${fee.price}/${fee.timeUnit}`)
    .join(" | ");
}

function buildMainPrice(fees: ParkingFee[]) {
  const firstComparableFee = [...fees].sort(
    (left, right) => parseComparablePrice(left.price) - parseComparablePrice(right.price),
  )[0];

  if (!firstComparableFee) {
    return "Consultar";
  }

  return `${firstComparableFee.price}/${firstComparableFee.timeUnit}`;
}

function buildComparableNormalPrice(fees: ParkingFee[]) {
  if (fees.length === 0) {
    return 0;
  }

  return Math.min(...fees.map((fee) => parseComparablePrice(fee.price)));
}

function buildRestrictions(record: ParkingRecord) {
  const physicalRestrictions = asSingle(record.parking_restrictions);
  const restrictionItems = (record.parking_restriction_items ?? [])
    .map((item) => asSingle(item.restriction_types)?.name ?? null)
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase());

  return {
    behavioral: restrictionItems,
    physical: {
      maxHeight: String(physicalRestrictions?.max_height ?? 0),
      maxSpeed: String(physicalRestrictions?.max_speed ?? 0),
    },
  };
}

function buildLocation(location: LocationRow | null) {
  return {
    googleMapsEmbed: location?.google_maps_link ?? "",
    googleMapsLink: location?.google_maps_link ?? "",
    latitude: location?.latitude ?? 0,
    longitude: location?.longitude ?? 0,
    municipality: location?.municipality ?? "",
    reference: location?.reference_address ?? "",
    streetAddress: location?.street_address ?? "",
    wazeEmbed: location?.waze_link ?? "",
    wazeLink: location?.waze_link ?? "",
  };
}

function calculateAverageRating(reviews: ParkingReview[]) {
  if (reviews.length === 0) {
    return null;
  }

  return reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;
}

function mapParkingRecord(record: ParkingRecord): Parking {
  const location = asSingle(record.locations);
  const category = asSingle(record.parking_categories);
  const capacity = asSingle(record.parking_capacities);
  const images = [...(record.parking_images ?? [])].sort(
    (left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0),
  );
  const primaryImage =
    images.find((image) => image.is_primary) ??
    images[0] ?? {
      id: 0,
      image_url: "/parkingsv/parking-default.png",
      is_primary: true,
      sort_order: 0,
    };
  const vehicleCapacities = buildVehicleCapacities(record.parking_vehicle_capacities);
  const fees = buildParkingFees(record.parking_fees);
  const reviews = buildParkingReviews(record.reviews);
  const averageRating = calculateAverageRating(reviews);
  const bicycleCapacity = vehicleCapacities.find((item) => item.id === 9)?.capacity ?? 0;
  const reservableSpaces =
    capacity?.reservable_capacity ??
    vehicleCapacities.reduce((total, item) => total + item.reservableCapacity, 0);

  return {
    address: location?.street_address ?? "",
    businessName: record.contact_name?.trim() || record.name,
    capacitySummary: {
      bicycle: bicycleCapacity,
      disability: capacity?.disability_spaces ?? 0,
      general: capacity?.general_capacity ?? 0,
      pregnant: capacity?.pregnant_people_spaces ?? 0,
      reservable: reservableSpaces ?? 0,
      taxi: capacity?.taxi_spaces ?? 0,
    },
    category: resolveCategoryName(category?.name ?? "normal"),
    contact: {
      email: record.contact_email?.trim() || "",
      name: record.contact_name?.trim() || record.name,
      phone: record.contact_phone?.trim() || "",
    },
    dbId: record.id,
    department: location?.department ?? "",
    description: record.description,
    fees,
    id: createParkingId(record.id),
    image: resolveLegacyParkingImage(primaryImage.image_url),
    images: images.map((image) => resolveLegacyParkingImage(image.image_url)),
    is24_7: Boolean(record.is_24_7),
    location: buildLocation(location),
    mainPrice: buildMainPrice(fees),
    municipality: location?.municipality ?? "",
    name: record.name,
    normalPrice: buildComparableNormalPrice(fees),
    priceSummary: buildPriceSummary(fees),
    rating: averageRating,
    reference: location?.reference_address ?? "",
    reservableSpaces: reservableSpaces ?? 0,
    restrictions: buildRestrictions(record),
    reviews,
    schedule: normalizeSchedule(record.schedule),
    services: (record.parking_services ?? [])
      .map((service) => asSingle(service.services))
      .filter((service): service is ServiceRow => Boolean(service))
      .map((service) => ({
        icon: normalizeServiceIcon(service.icon),
        value: service.name,
      })),
    vehicleCapacities,
  };
}

async function queryParkings() {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("parkings")
      .select(PARKING_SELECT)
      .eq("status", "activo");

    if (error) {
      throw error;
    }

    return (data ?? []) as ParkingRecord[];
  } catch (error) {
    console.warn("Failed to load published parkings.", formatSupabaseErrorForLog(error));
    return [];
  }
}

export async function getPublishedParkings() {
  const records = await queryParkings();
  return records.map(mapParkingRecord);
}

export async function getPublishedParkingBySlug(slug: string) {
  const records = await queryParkings();
  const record = records.find((parking) => createParkingId(parking.id) === slug);
  return record ? mapParkingRecord(record) : null;
}

export async function getOwnedParkingsForUser(userId: number) {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("parkings")
      .select(PARKING_SELECT)
      .eq("owner_id", userId)
      .eq("status", "activo")
      .order("id", { ascending: true });

    if (error) {
      throw error;
    }

    return ((data ?? []) as ParkingRecord[]).map(mapParkingRecord);
  } catch (error) {
    console.warn("Failed to load owned parkings.", formatSupabaseErrorForLog(error));
    return [];
  }
}
