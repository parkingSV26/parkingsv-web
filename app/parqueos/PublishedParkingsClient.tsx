"use client";

import {
  startTransition,
  useEffect,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./parqueos-publicados.module.css";
import {
  DEFAULT_PARKING_FILTERS,
  dayMap,
  dayOptions,
  parkingData,
  type DayFilter,
  type Parking,
  type ParkingFilters,
  type SpanishDay,
} from "./parking-data";

type PublishedParkingsClientProps = {
  initialFilters: ParkingFilters;
};

type ParkingStatus = {
  icon: string;
  label: string;
  tone: "open" | "closedNow" | "closedToday" | "openingSoon" | "closingSoon" | "alwaysOpen";
};

export default function PublishedParkingsClient({
  initialFilters,
}: PublishedParkingsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [filtersOpen, setFiltersOpen] = useState(hasAdvancedFilters(initialFilters));
  const [formFilters, setFormFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [notification, setNotification] = useState("");
  const favoriteSnapshot = useSyncExternalStore(
    subscribeToFavorites,
    getFavoritesSnapshot,
    getServerFavoritesSnapshot,
  );
  const favorites = parseFavoritesSnapshot(favoriteSnapshot);

  useEffect(() => {
    if (!notification) {
      return;
    }

    const timer = window.setTimeout(() => setNotification(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notification]);

  const departments = getDepartments();
  const municipalityOptions = getMunicipalitiesByDepartment(formFilters.department);
  const activeFilterCount = countActiveFilters(appliedFilters);
  const filteredParkings = filterParkings(appliedFilters);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyFilters(formFilters);
  }

  function handleDepartmentChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextDepartment = event.target.value;

    setFormFilters((current) => ({
      ...current,
      department: nextDepartment,
      municipality: "",
    }));
  }

  function handleFieldChange<Key extends keyof ParkingFilters>(key: Key, value: ParkingFilters[Key]) {
    setFormFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function applyFilters(nextFilters: ParkingFilters) {
    const normalizedFilters = normalizeFilters(nextFilters);
    const nextQueryString = buildQueryString(normalizedFilters);

    setAppliedFilters(normalizedFilters);
    setFormFilters(normalizedFilters);
    setFiltersOpen(false);

    startTransition(() => {
      router.replace(nextQueryString ? `${pathname}?${nextQueryString}` : pathname, { scroll: false });
    });

    scrollToResults();
  }

  function resetFilters() {
    setFormFilters(DEFAULT_PARKING_FILTERS);
    setAppliedFilters(DEFAULT_PARKING_FILTERS);
    setFiltersOpen(false);

    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });

    scrollToResults();
  }

  function toggleFavorite(parking: Parking) {
    const exists = favorites.includes(parking.id);
    const nextFavorites = exists
      ? favorites.filter((item) => item !== parking.id)
      : [...favorites, parking.id];

    writeFavorites(nextFavorites);
    setNotification(
      exists
        ? `Parqueo eliminado de favoritos: ${parking.name}`
        : `Parqueo guardado en favoritos: ${parking.name}`,
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <div className={styles.heroText}>
            <h1 className={styles.title}>
              Aquí esta lo que <span>buscas</span>!
            </h1>
            <p className={styles.intro}>
              Busca por nombre, aplica filtros útiles y encuentra parqueos que si respondan a tus
              necesidades reales.
            </p>
          </div>

          <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
            <div className={styles.searchRow}>
              <label className={styles.searchField} htmlFor="parking-search">
                <i className="fas fa-search" aria-hidden="true" />
                <input
                  id="parking-search"
                  type="search"
                  name="q"
                  value={formFilters.q}
                  placeholder="Buscar parqueo, municipio o zona..."
                  onChange={(event) => handleFieldChange("q", event.target.value)}
                />
                {formFilters.q ? (
                  <button
                    type="button"
                    className={styles.searchClear}
                    aria-label="Limpiar búsqueda"
                    onClick={() => handleFieldChange("q", "")}
                  >
                    <i className="fas fa-times" aria-hidden="true" />
                  </button>
                ) : null}
              </label>

              <button type="submit" className={styles.searchButton}>
                <i className="fas fa-search" aria-hidden="true" />
                <span>Buscar</span>
              </button>
            </div>

            <div className={styles.filterToggleRow}>
              <button
                type="button"
                className={`${styles.filterToggle} ${
                  filtersOpen || activeFilterCount > 0 ? styles.filterToggleActive : ""
                }`}
                aria-expanded={filtersOpen ? "true" : "false"}
                onClick={() => setFiltersOpen((current) => !current)}
              >
                <i className="fas fa-sliders-h" aria-hidden="true" />
                <span>{filtersOpen ? "Ocultar filtros" : "Mostrar filtros"}</span>
                {activeFilterCount > 0 ? <strong>{activeFilterCount}</strong> : null}
              </button>
            </div>
          </form>
        </header>

        {activeFilterCount > 0 ? (
          <div className={styles.activeFilters}>
            {renderActiveFilterChips(appliedFilters).map((label) => (
              <span key={label} className={styles.activeFilterChip}>
                {label}
              </span>
            ))}

            <button type="button" className={styles.clearAllButton} onClick={resetFilters}>
              Limpiar todo
            </button>
          </div>
        ) : null}

        <section className={`${styles.filtersPanel} ${filtersOpen ? styles.filtersPanelOpen : ""}`}>
          <form className={styles.filtersGrid} onSubmit={handleSearchSubmit}>
            <div className={styles.filterGroup}>
              <label htmlFor="department-filter">
                <i className="fas fa-map-marker-alt" aria-hidden="true" />
                Ubicación
              </label>

              <div className={styles.locationRow}>
                <select
                  id="department-filter"
                  value={formFilters.department}
                  onChange={handleDepartmentChange}
                >
                  <option value="">Todos los departamentos</option>
                  {departments.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>

                <select
                  id="municipality-filter"
                  value={formFilters.municipality}
                  disabled={!formFilters.department}
                  onChange={(event) => handleFieldChange("municipality", event.target.value)}
                >
                  <option value="">Todos los municipios</option>
                  {municipalityOptions.map((municipality) => (
                    <option key={municipality} value={municipality}>
                      {municipality}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="max-price">
                <i className="fas fa-tag" aria-hidden="true" />
                Precio máximo estimado
              </label>

              <div className={styles.rangeWrap}>
                <input
                  id="max-price"
                  type="range"
                  min="0"
                  max="50"
                  step="0.5"
                  value={formFilters.maxPrice}
                  onChange={(event) => handleFieldChange("maxPrice", Number(event.target.value))}
                />

                <div className={styles.rangeValues}>
                  <span>$0</span>
                  <strong>${formFilters.maxPrice.toFixed(2)}</strong>
                  <span>$50+</span>
                </div>
              </div>
            </div>

            <div className={styles.filterGroup}>
              <label>
                <i className="fas fa-calendar-check" aria-hidden="true" />
                Reservas
              </label>

              <div className={styles.optionRow}>
                <label className={styles.optionPill}>
                  <input
                    type="radio"
                    name="reservable"
                    value="all"
                    checked={formFilters.reservable === "all"}
                    onChange={() => handleFieldChange("reservable", "all")}
                  />
                  <i className="fas fa-globe" aria-hidden="true" />
                  <span>Todos</span>
                </label>

                <label className={styles.optionPill}>
                  <input
                    type="radio"
                    name="reservable"
                    value="yes"
                    checked={formFilters.reservable === "yes"}
                    onChange={() => handleFieldChange("reservable", "yes")}
                  />
                  <i className="fas fa-check-circle" aria-hidden="true" />
                  <span>Solo reservables</span>
                </label>

                <label className={styles.optionPill}>
                  <input
                    type="radio"
                    name="reservable"
                    value="no"
                    checked={formFilters.reservable === "no"}
                    onChange={() => handleFieldChange("reservable", "no")}
                  />
                  <i className="fas fa-times-circle" aria-hidden="true" />
                  <span>No reservables</span>
                </label>
              </div>
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="day-filter">
                <i className="far fa-clock" aria-hidden="true" />
                Disponible en
              </label>

              <select
                id="day-filter"
                value={formFilters.day}
                onChange={(event) => handleFieldChange("day", event.target.value as DayFilter)}
              >
                {dayOptions.map((option) => (
                  <option key={option.value || "any"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterActions}>
              <button type="submit" className={styles.primaryAction}>
                <i className="fas fa-check" aria-hidden="true" />
                Aplicar filtros
              </button>

              <button type="button" className={styles.secondaryAction} onClick={resetFilters}>
                <i className="fas fa-rotate-left" aria-hidden="true" />
                Limpiar filtros
              </button>
            </div>
          </form>
        </section>

        <section className={styles.inlineAd}>
          <div>
            <span className={styles.inlineAdEyebrow}>Espacio disponible</span>
            <h2>Anúnciate aquí</h2>
            <p>
              Muestra negocios cercanos, servicios automotrices o promociones locales justo cuando
              el usuario busca parqueo.
            </p>
          </div>

          <a href="/sobre-nosotros" className={styles.inlineAdLink}>
            Mas información
          </a>
        </section>

        <section id="parking-results" className={styles.resultsSection}>
          <div className={styles.resultsHeader}>
            <div>
              <h2>Parqueos disponibles</h2>
              <p>
                {filteredParkings.length} resultado{filteredParkings.length === 1 ? "" : "s"} de{" "}
                {parkingData.length} parqueos publicados.
              </p>
            </div>
          </div>

          {filteredParkings.length > 0 ? (
            <div className={styles.cardGrid}>
              {filteredParkings.map((parking) => {
                const status = getParkingStatus(parking);
                const isFavorite = favorites.includes(parking.id);

                return (
                  <article key={parking.id} className={styles.card}>
                    <div className={styles.cardMedia}>
                      {parking.rating === null ? <span className={styles.newBadge}>Nuevo</span> : null}

                      <button
                        type="button"
                        className={`${styles.favoriteButton} ${
                          isFavorite ? styles.favoriteButtonActive : ""
                        }`}
                        aria-label={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
                        onClick={() => toggleFavorite(parking)}
                      >
                        <i
                          className={isFavorite ? "fas fa-bookmark" : "far fa-bookmark"}
                          aria-hidden="true"
                        />
                      </button>

                      <Image
                        src={parking.image}
                        alt={parking.name}
                        fill
                        sizes="(max-width: 520px) 100vw, (max-width: 980px) 50vw, (max-width: 1320px) 33vw, 380px"
                        className={styles.cardImage}
                      />
                    </div>

                    <div className={styles.cardBody}>
                      <div className={styles.cardHeading}>
                        <div>
                          <h3>{parking.name}</h3>
                          <p className={styles.cardLocation}>
                            <i className="fas fa-location-dot" aria-hidden="true" />
                            <span>{formatParkingLocation(parking.department, parking.municipality)}</span>
                          </p>
                        </div>
                      </div>

                      <div className={styles.cardFooter}>
                        <div className={styles.scheduleBlock}>
                          <p className={styles.scheduleLine}>
                            <i className="far fa-clock" aria-hidden="true" />
                            <span>{getScheduleText(parking)}</span>
                          </p>

                          <span
                            className={`${styles.statusPill} ${getStatusToneClassName(styles, status.tone)}`}
                          >
                            <i className={status.icon} aria-hidden="true" />
                            <span>{status.label}</span>
                          </span>
                        </div>

                        {parking.rating === null ? null : (
                          <span className={styles.ratingBadge}>
                            <span>{parking.rating.toFixed(1)}</span>
                            <i className="fas fa-star" aria-hidden="true" />
                          </span>
                        )}
                      </div>

                      <div className={styles.cardActions}>
                        <Link href={`/parqueos/${parking.id}`} className={styles.detailLink}>
                          <span>Ver detalles</span>
                          <i className="fas fa-arrow-right" aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <i className="fas fa-search-location" aria-hidden="true" />
              <h3>No encontramos parqueos con esos filtros</h3>
              <p>Prueba limpiando filtros o buscando por otra zona, municipio o tipo de necesidad.</p>
              <button type="button" className={styles.primaryAction} onClick={resetFilters}>
                Ver todos
              </button>
            </div>
          )}
        </section>
      </div>

      {notification ? (
        <div className={styles.notification} role="status">
          {notification}
        </div>
      ) : null}
    </section>
  );
}

function getDepartments() {
  return Array.from(new Set(parkingData.map((parking) => parking.department))).sort((left, right) =>
    left.localeCompare(right, "es"),
  );
}

function formatParkingLocation(department: string, municipality: string) {
  return normalizeText(department) === normalizeText(municipality)
    ? department
    : `${department}, ${municipality}`;
}

function getMunicipalitiesByDepartment(department: string) {
  const source = department
    ? parkingData.filter((parking) => parking.department === department)
    : parkingData;

  return Array.from(new Set(source.map((parking) => parking.municipality))).sort((left, right) =>
    left.localeCompare(right, "es"),
  );
}

function hasAdvancedFilters(filters: ParkingFilters) {
  return (
    filters.department !== "" ||
    filters.municipality !== "" ||
    filters.maxPrice < DEFAULT_PARKING_FILTERS.maxPrice ||
    filters.reservable !== DEFAULT_PARKING_FILTERS.reservable ||
    filters.day !== DEFAULT_PARKING_FILTERS.day
  );
}

function countActiveFilters(filters: ParkingFilters) {
  let count = 0;

  if (filters.q.trim()) {
    count += 1;
  }

  if (filters.department) {
    count += 1;
  }

  if (filters.municipality) {
    count += 1;
  }

  if (filters.maxPrice < DEFAULT_PARKING_FILTERS.maxPrice) {
    count += 1;
  }

  if (filters.reservable !== DEFAULT_PARKING_FILTERS.reservable) {
    count += 1;
  }

  if (filters.day) {
    count += 1;
  }

  return count;
}

function normalizeFilters(filters: ParkingFilters): ParkingFilters {
  const nextDepartment = filters.department.trim();
  const nextMunicipality = nextDepartment ? filters.municipality.trim() : "";
  const availableMunicipalities = getMunicipalitiesByDepartment(nextDepartment);

  return {
    q: filters.q.trim(),
    department: nextDepartment,
    municipality: availableMunicipalities.includes(nextMunicipality) ? nextMunicipality : "",
    maxPrice: Math.min(50, Math.max(0, filters.maxPrice)),
    reservable: filters.reservable,
    day: filters.day,
  };
}

function buildQueryString(filters: ParkingFilters) {
  const params = new URLSearchParams();

  if (filters.q) {
    params.set("q", filters.q);
  }

  if (filters.department) {
    params.set("department", filters.department);
  }

  if (filters.municipality) {
    params.set("municipality", filters.municipality);
  }

  if (filters.maxPrice < DEFAULT_PARKING_FILTERS.maxPrice) {
    params.set("max_price", String(filters.maxPrice));
  }

  if (filters.reservable !== DEFAULT_PARKING_FILTERS.reservable) {
    params.set("reservable", filters.reservable);
  }

  if (filters.day) {
    params.set("date", filters.day);
  }

  return params.toString();
}

function renderActiveFilterChips(filters: ParkingFilters) {
  const chips: string[] = [];

  if (filters.q) {
    chips.push(`Búsqueda: ${filters.q}`);
  }

  if (filters.department) {
    chips.push(`Departamento: ${filters.department}`);
  }

  if (filters.municipality) {
    chips.push(`Municipio: ${filters.municipality}`);
  }

  if (filters.maxPrice < DEFAULT_PARKING_FILTERS.maxPrice) {
    chips.push(`Hasta $${filters.maxPrice.toFixed(2)}`);
  }

  if (filters.reservable === "yes") {
    chips.push("Solo reservables");
  } else if (filters.reservable === "no") {
    chips.push("No reservables");
  }

  if (filters.day) {
    const dayLabel = dayOptions.find((option) => option.value === filters.day)?.label;
    if (dayLabel) {
      chips.push(`Disponible: ${dayLabel}`);
    }
  }

  return chips;
}

function filterParkings(filters: ParkingFilters) {
  return parkingData.filter((parking) => {
    const normalizedQuery = normalizeText(filters.q);
    const matchesQuery =
      normalizedQuery === "" ||
      normalizeText(
        [
          parking.name,
          parking.department,
          parking.municipality,
          parking.address,
          parking.reference,
          parking.description,
          parking.priceSummary,
          parking.services.map((service) => service.value).join(" "),
        ].join(" "),
      ).includes(normalizedQuery);

    const matchesDepartment = !filters.department || parking.department === filters.department;
    const matchesMunicipality = !filters.municipality || parking.municipality === filters.municipality;
    const matchesPrice = parking.normalPrice <= filters.maxPrice;
    const matchesReservable =
      filters.reservable === "all" ||
      (filters.reservable === "yes" && parking.reservableSpaces > 0) ||
      (filters.reservable === "no" && parking.reservableSpaces === 0);
    const matchesDay =
      filters.day === "" || parking.is24_7 || Boolean(parking.schedule[dayMap[filters.day]]?.length);

    return (
      matchesQuery &&
      matchesDepartment &&
      matchesMunicipality &&
      matchesPrice &&
      matchesReservable &&
      matchesDay
    );
  });
}

function getScheduleText(parking: Parking) {
  if (parking.is24_7) {
    return "Abierto siempre";
  }

  const today = getToday();
  const slots = parking.schedule[today] ?? [];

  if (slots.length === 0) {
    return "Cerrado";
  }

  return slots.map((slot) => `${formatHour(slot.apertura)} - ${formatHour(slot.cierre)}`).join(" y ");
}

function getParkingStatus(parking: Parking): ParkingStatus {
  if (parking.is24_7) {
    return {
      icon: "fas fa-infinity",
      label: "Abierto 24/7",
      tone: "alwaysOpen",
    };
  }

  const today = getToday();
  const slots = parking.schedule[today] ?? [];

  if (slots.length === 0) {
    return {
      icon: "fas fa-door-closed",
      label: "Cerrado hoy",
      tone: "closedToday",
    };
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  let openingSoon = false;

  for (const slot of slots) {
    const openMinutes = getMinutes(slot.apertura);
    const closeMinutes = getMinutes(slot.cierre);

    if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
      if (closeMinutes - currentMinutes <= 30) {
        return {
          icon: "fas fa-exclamation-triangle",
          label: "Cierra pronto",
          tone: "closingSoon",
        };
      }

      return {
        icon: "fas fa-door-open",
        label: "Abierto ahora",
        tone: "open",
      };
    }

    if (currentMinutes < openMinutes && openMinutes - currentMinutes <= 60) {
      openingSoon = true;
    }
  }

  if (openingSoon) {
    return {
      icon: "fas fa-hourglass-start",
      label: "Abre pronto",
      tone: "openingSoon",
    };
  }

  return {
    icon: "fas fa-door-closed",
    label: "Ya cerró",
    tone: "closedNow",
  };
}

function getStatusToneClassName(
  moduleStyles: Record<string, string>,
  tone: ParkingStatus["tone"],
) {
  switch (tone) {
    case "open":
      return moduleStyles.statusOpen;
    case "closedNow":
      return moduleStyles.statusClosedNow;
    case "closedToday":
      return moduleStyles.statusClosedToday;
    case "openingSoon":
      return moduleStyles.statusOpeningSoon;
    case "closingSoon":
      return moduleStyles.statusClosingSoon;
    case "alwaysOpen":
      return moduleStyles.statusAlwaysOpen;
    default:
      return "";
  }
}

function getToday(): SpanishDay {
  const days: SpanishDay[] = [
    "domingo",
    "lunes",
    "martes",
    "miercoles",
    "jueves",
    "viernes",
    "sabado",
  ];

  return days[new Date().getDay()];
}

function getMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatHour(time: string) {
  const [hours, minutes] = time.split(":");
  const hour = Number(hours);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minutes} ${suffix}`;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function scrollToResults() {
  window.requestAnimationFrame(() => {
    document.getElementById("parking-results")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

function subscribeToFavorites(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const notify = () => callback();

  window.addEventListener("storage", notify);
  window.addEventListener("parking-favorites-change", notify);

  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener("parking-favorites-change", notify);
  };
}

function getFavoritesSnapshot() {
  if (typeof window === "undefined") {
    return "[]";
  }

  try {
    return window.localStorage.getItem("parkingFavorites") ?? "[]";
  } catch {
    return "[]";
  }
}

function getServerFavoritesSnapshot() {
  return "[]";
}

function parseFavoritesSnapshot(snapshot: string) {
  try {
    const parsed = JSON.parse(snapshot);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}

function writeFavorites(nextFavorites: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem("parkingFavorites", JSON.stringify(nextFavorites));
    window.dispatchEvent(new Event("parking-favorites-change"));
  } catch {
    // Si localStorage falla, no rompemos la página.
  }
}
