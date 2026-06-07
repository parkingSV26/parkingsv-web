export type ReservationFilter = "all" | "yes" | "no";

export type DayFilter =
  | ""
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type ParkingDayKey =
  | "domingo"
  | "lunes"
  | "martes"
  | "miercoles"
  | "jueves"
  | "viernes"
  | "sabado";

export type ScheduleSlot = {
  apertura: string;
  cierre: string;
};

export type ParkingService = {
  icon: string;
  value: string;
};

export type ParkingFee = {
  appliesTo: "all_week" | "weekdays" | "weekends";
  feeType: "evento" | "nocturno" | "normal" | "premium";
  icon: string;
  id: string;
  price: string;
  timeUnit: string;
  validFrom?: string | null;
  validTo?: string | null;
  vehicleType: string;
};

export type ParkingReview = {
  author: string;
  avatar: string;
  comment: string;
  createdAt: string;
  id: string;
  rating: number;
};

export type VehicleCapacity = {
  capacity: number;
  categoryName: string;
  icon: string;
  id: number;
  reservableCapacity: number;
};

export type Parking = {
  address: string;
  businessName: string;
  capacitySummary: {
    bicycle: number;
    disability: number;
    general: number;
    pregnant: number;
    reservable: number;
    taxi: number;
  };
  category: string;
  contact: {
    email: string;
    name: string;
    phone: string;
  };
  dbId: number;
  department: string;
  description: string;
  fees: ParkingFee[];
  id: string;
  image: string;
  images: string[];
  is24_7: boolean;
  location: {
    googleMapsEmbed: string;
    googleMapsLink: string;
    latitude: number;
    longitude: number;
    municipality: string;
    reference: string;
    streetAddress: string;
    wazeEmbed: string;
    wazeLink: string;
  };
  mainPrice: string;
  municipality: string;
  name: string;
  normalPrice: number;
  priceSummary: string;
  rating: number | null;
  reference: string;
  reservableSpaces: number;
  restrictions: {
    behavioral: string[];
    physical: {
      maxHeight: string;
      maxSpeed: string;
    };
  };
  reviews: ParkingReview[];
  schedule: Partial<Record<ParkingDayKey, ScheduleSlot[]>>;
  services: ParkingService[];
  vehicleCapacities: VehicleCapacity[];
};

export type ParkingFilters = {
  day: DayFilter;
  department: string;
  maxPrice: number;
  municipality: string;
  q: string;
  reservable: ReservationFilter;
};

export const DEFAULT_PARKING_FILTERS: ParkingFilters = {
  q: "",
  department: "",
  municipality: "",
  maxPrice: 50,
  reservable: "all",
  day: "",
};

export const dayOptions: Array<{ value: DayFilter; label: string }> = [
  { value: "", label: "Cualquier dia" },
  { value: "monday", label: "Lunes" },
  { value: "tuesday", label: "Martes" },
  { value: "wednesday", label: "Miercoles" },
  { value: "thursday", label: "Jueves" },
  { value: "friday", label: "Viernes" },
  { value: "saturday", label: "Sabado" },
  { value: "sunday", label: "Domingo" },
];

export const dayMap: Record<Exclude<DayFilter, "">, ParkingDayKey> = {
  monday: "lunes",
  tuesday: "martes",
  wednesday: "miercoles",
  thursday: "jueves",
  friday: "viernes",
  saturday: "sabado",
  sunday: "domingo",
};
