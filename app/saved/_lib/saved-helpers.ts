import type { SavedParkingState } from "@/app/lib/favorites";
import type { Parking } from "@/app/parkings/parking-data";

export { type SavedFolder, type SavedParkingState } from "@/app/lib/favorites";

export function buildUnassignedFavoriteIds(state: SavedParkingState) {
  const assigned = new Set(state.folders.flatMap((folder) => folder.parkingIds));
  return state.favoriteIds.filter((parkingId) => !assigned.has(parkingId));
}

export function getFolderById(state: SavedParkingState, folderId: string) {
  return state.folders.find((folder) => folder.id === folderId) ?? null;
}

export function getParkingsByIds(parkings: Parking[], ids: string[]) {
  const parkingMap = new Map(parkings.map((parking) => [parking.id, parking]));
  return ids.map((parkingId) => parkingMap.get(parkingId)).filter((parking): parking is Parking => Boolean(parking));
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

  const fallbackSlots = Object.values(parking.schedule).find(
    (slots) => Array.isArray(slots) && slots.length > 0,
  );

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

function formatHour(time: string) {
  const [hours, minutes] = time.split(":");
  const numericHour = Number(hours);
  const suffix = numericHour >= 12 ? "PM" : "AM";
  const displayHour = numericHour % 12 || 12;

  return `${displayHour}:${minutes} ${suffix}`;
}
