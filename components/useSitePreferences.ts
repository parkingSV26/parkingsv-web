"use client";

import { useSyncExternalStore } from "react";
import {
  defaultPreferences,
  PREFERENCES_EVENT_NAME,
  readStoredPreferences,
  type ParkingPreferences,
} from "@/app/settings/_lib/preferences";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", callback);
  window.addEventListener(PREFERENCES_EVENT_NAME, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(PREFERENCES_EVENT_NAME, callback);
  };
}

function getSnapshot(): ParkingPreferences {
  return readStoredPreferences();
}

function getServerSnapshot(): ParkingPreferences {
  return defaultPreferences;
}

export function useSitePreferences() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
