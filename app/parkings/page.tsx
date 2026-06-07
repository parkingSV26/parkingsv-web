import type { Metadata } from "next";
import { getSavedParkingStateForUser } from "@/app/lib/favorites";
import { getPublishedParkings } from "@/app/lib/parkings";
import { getSessionUser } from "@/app/lib/auth/session";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import PublishedParkingsClient from "./PublishedParkingsClient";
import {
  DEFAULT_PARKING_FILTERS,
  type DayFilter,
  type ParkingFilters,
  type ReservationFilter,
} from "./parking-data";

export const metadata: Metadata = {
  title: "Parking SV - Parqueos publicados",
  description: "Busca parqueos publicados, aplica filtros utiles y explora opciones disponibles.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type ParkingsPageProps = {
  searchParams: SearchParams;
};

export default async function ParkingsPage({ searchParams }: ParkingsPageProps) {
  const filters = parseParkingFilters(await searchParams);
  const [parkings, sessionUser] = await Promise.all([getPublishedParkings(), getSessionUser()]);
  const savedState = sessionUser
    ? await getSavedParkingStateForUser(sessionUser.id)
    : { favoriteIds: [], folders: [] };
  const filtersKey = [
    filters.q,
    filters.department,
    filters.municipality,
    filters.maxPrice,
    filters.reservable,
    filters.day,
  ].join("|");

  return (
    <>
      <SiteHeader activePage="parkings" />
      <main>
        <PublishedParkingsClient
          key={filtersKey}
          initialFilters={filters}
          initialSavedState={savedState}
          isAuthenticated={Boolean(sessionUser)}
          parkings={parkings}
        />
      </main>
      <SiteFooter />
    </>
  );
}

function parseParkingFilters(
  searchParams: Record<string, string | string[] | undefined>,
): ParkingFilters {
  const q = readFirst(searchParams.q).trim();
  const department = readFirst(searchParams.department).trim();
  const municipality = readFirst(searchParams.municipality).trim();
  const maxPrice = clampPrice(readFirst(searchParams.max_price));
  const reservable = parseReservationFilter(readFirst(searchParams.reservable));
  const day = parseDay(readFirst(searchParams.date));

  return {
    ...DEFAULT_PARKING_FILTERS,
    q,
    department,
    municipality,
    maxPrice,
    reservable,
    day,
  };
}

function readFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function clampPrice(rawValue: string) {
  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_PARKING_FILTERS.maxPrice;
  }

  return Math.min(50, Math.max(0, parsed));
}

function parseReservationFilter(value: string): ReservationFilter {
  if (value === "yes" || value === "no") {
    return value;
  }

  return DEFAULT_PARKING_FILTERS.reservable;
}

function parseDay(value: string): DayFilter {
  const allowedDays: DayFilter[] = [
    "",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  return allowedDays.includes(value as DayFilter) ? (value as DayFilter) : DEFAULT_PARKING_FILTERS.day;
}
