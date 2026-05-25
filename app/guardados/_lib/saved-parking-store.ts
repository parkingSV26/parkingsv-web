import { parkingData, type Parking } from "@/app/parqueos/parking-data";

export type SavedFolder = {
  color: string;
  createdAt: string;
  id: string;
  name: string;
  parkingIds: string[];
};

export type SavedParkingState = {
  favoriteIds: string[];
  folders: SavedFolder[];
};

const FAVORITES_STORAGE_KEY = "parkingFavorites";
const FOLDERS_STORAGE_KEY = "parkingFavoriteFolders";
const GUARDADOS_EVENT = "parking-guardados-change";

export function subscribeToSavedParkingState(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const notify = () => callback();

  window.addEventListener("storage", notify);
  window.addEventListener("parking-favorites-change", notify);
  window.addEventListener(GUARDADOS_EVENT, notify);

  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener("parking-favorites-change", notify);
    window.removeEventListener(GUARDADOS_EVENT, notify);
  };
}

export function getSavedParkingSnapshot() {
  if (typeof window === "undefined") {
    return getServerSavedParkingSnapshot();
  }

  return JSON.stringify(readSavedParkingState());
}

export function getServerSavedParkingSnapshot() {
  return JSON.stringify({
    favoriteIds: [],
    folders: [],
  } satisfies SavedParkingState);
}

export function parseSavedParkingSnapshot(snapshot: string): SavedParkingState {
  try {
    const parsed = JSON.parse(snapshot) as Partial<SavedParkingState>;

    return normalizeSavedParkingState({
      favoriteIds: parsed.favoriteIds ?? [],
      folders: parsed.folders ?? [],
    });
  } catch {
    return {
      favoriteIds: [],
      folders: [],
    };
  }
}

export function readSavedParkingState(): SavedParkingState {
  if (typeof window === "undefined") {
    return {
      favoriteIds: [],
      folders: [],
    };
  }

  try {
    const favoriteIds = sanitizeParkingIds(
      JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY) ?? "[]"),
    );
    const folders = sanitizeFolders(
      JSON.parse(window.localStorage.getItem(FOLDERS_STORAGE_KEY) ?? "[]"),
      favoriteIds,
    );

    return {
      favoriteIds,
      folders,
    };
  } catch {
    return {
      favoriteIds: [],
      folders: [],
    };
  }
}

export function writeSavedParkingState(state: SavedParkingState) {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = normalizeSavedParkingState(state);

  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(normalized.favoriteIds));
    window.localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(normalized.folders));
    window.dispatchEvent(new Event("parking-favorites-change"));
    window.dispatchEvent(new Event(GUARDADOS_EVENT));
  } catch {
    // Si localStorage falla, dejamos la UI viva.
  }
}

export function buildUnassignedFavoriteIds(state: SavedParkingState) {
  const assigned = new Set(state.folders.flatMap((folder) => folder.parkingIds));
  return state.favoriteIds.filter((parkingId) => !assigned.has(parkingId));
}

export function createFolderInState(
  state: SavedParkingState,
  input: {
    color: string;
    name: string;
    parkingIds: string[];
  },
) {
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    return state;
  }

  const nextFolder: SavedFolder = {
    id: createFolderId(),
    name: trimmedName,
    color: input.color || "#0C6FF9",
    parkingIds: sanitizeParkingIds(input.parkingIds).filter((parkingId) =>
      state.favoriteIds.includes(parkingId),
    ),
    createdAt: new Date().toISOString(),
  };

  return normalizeSavedParkingState({
    favoriteIds: state.favoriteIds,
    folders: [nextFolder, ...state.folders],
  });
}

export function removeParkingEverywhere(state: SavedParkingState, parkingId: string) {
  return normalizeSavedParkingState({
    favoriteIds: state.favoriteIds.filter((currentId) => currentId !== parkingId),
    folders: state.folders.map((folder) => ({
      ...folder,
      parkingIds: folder.parkingIds.filter((currentId) => currentId !== parkingId),
    })),
  });
}

export function removeParkingFromFolder(
  state: SavedParkingState,
  folderId: string,
  parkingId: string,
) {
  return normalizeSavedParkingState({
    favoriteIds: state.favoriteIds,
    folders: state.folders.map((folder) =>
      folder.id === folderId
        ? {
            ...folder,
            parkingIds: folder.parkingIds.filter((currentId) => currentId !== parkingId),
          }
        : folder,
    ),
  });
}

export function getFolderById(state: SavedParkingState, folderId: string) {
  return state.folders.find((folder) => folder.id === folderId) ?? null;
}

export function getParkingsByIds(ids: string[]) {
  return sanitizeParkingIds(ids)
    .map((parkingId) => getParkingById(parkingId))
    .filter((parking): parking is Parking => parking !== null);
}

export function getParkingById(parkingId: string) {
  return parkingData.find((parking) => parking.id === parkingId) ?? null;
}

export function getParkingCountLabel(count: number) {
  return `${count} parqueo${count === 1 ? "" : "s"}`;
}

export function formatParkingSchedule(parking: Parking) {
  if (parking.is24_7) {
    return "Abierto siempre";
  }

  const mondaySlots = parking.schedule.lunes ?? [];

  if (mondaySlots.length > 0) {
    return mondaySlots
      .map((slot) => `${formatHour(slot.apertura)} - ${formatHour(slot.cierre)}`)
      .join(" y ");
  }

  const fallbackSlots = Object.values(parking.schedule).find((slots) => Array.isArray(slots) && slots.length > 0);

  if (fallbackSlots && fallbackSlots.length > 0) {
    return fallbackSlots
      .map((slot) => `${formatHour(slot.apertura)} - ${formatHour(slot.cierre)}`)
      .join(" y ");
  }

  return "Horario no disponible";
}

export function getParkingImage(parking: Parking) {
  return parking.image || "/parkingsv/parking-default.png";
}

function normalizeSavedParkingState(state: SavedParkingState): SavedParkingState {
  const favoriteIds = sanitizeParkingIds(state.favoriteIds);
  const folders = sanitizeFolders(state.folders, favoriteIds);

  return {
    favoriteIds,
    folders,
  };
}

function sanitizeParkingIds(candidate: unknown) {
  if (!Array.isArray(candidate)) {
    return [];
  }

  const uniqueIds = new Set<string>();

  for (const item of candidate) {
    if (typeof item !== "string") {
      continue;
    }

    if (!getParkingById(item)) {
      continue;
    }

    uniqueIds.add(item);
  }

  return Array.from(uniqueIds);
}

function sanitizeFolders(candidate: unknown, favoriteIds: string[]) {
  if (!Array.isArray(candidate)) {
    return [];
  }

  const favoriteSet = new Set(favoriteIds);
  const seenFolderIds = new Set<string>();
  const folders: SavedFolder[] = [];

  for (const rawFolder of candidate) {
    if (!rawFolder || typeof rawFolder !== "object") {
      continue;
    }

    const rawId = "id" in rawFolder ? rawFolder.id : "";
    const rawName = "name" in rawFolder ? rawFolder.name : "";
    const rawColor = "color" in rawFolder ? rawFolder.color : "";
    const rawCreatedAt = "createdAt" in rawFolder ? rawFolder.createdAt : "";
    const rawParkingIds = "parkingIds" in rawFolder ? rawFolder.parkingIds : [];

    if (typeof rawId !== "string" || typeof rawName !== "string") {
      continue;
    }

    const folderId = rawId.trim();
    const folderName = rawName.trim();

    if (!folderId || !folderName || seenFolderIds.has(folderId)) {
      continue;
    }

    const parkingIds = sanitizeParkingIds(rawParkingIds).filter((parkingId) => favoriteSet.has(parkingId));

    folders.push({
      id: folderId,
      name: folderName,
      color: typeof rawColor === "string" && rawColor.trim() ? rawColor : "#0C6FF9",
      createdAt:
        typeof rawCreatedAt === "string" && rawCreatedAt.trim()
          ? rawCreatedAt
          : new Date().toISOString(),
      parkingIds,
    });
    seenFolderIds.add(folderId);
  }

  return folders;
}

function createFolderId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `folder-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function formatHour(time: string) {
  const [hours, minutes] = time.split(":");
  const numericHour = Number(hours);
  const suffix = numericHour >= 12 ? "PM" : "AM";
  const displayHour = numericHour % 12 || 12;

  return `${displayHour}:${minutes} ${suffix}`;
}
