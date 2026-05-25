"use client";

import { useEffect } from "react";
import {
  PREFERENCES_EVENT_NAME,
  applyPreferencesToDocument,
  readStoredPreferences,
} from "@/app/configuracion/_lib/preferences";

export default function PreferencesBridge() {
  useEffect(() => {
    const syncPreferences = () => {
      // Reaplicamos preferencias al documento cada vez que otra pestaña o pantalla las cambia.
      applyPreferencesToDocument(readStoredPreferences());
    };

    syncPreferences();
    window.addEventListener("storage", syncPreferences);
    window.addEventListener(PREFERENCES_EVENT_NAME, syncPreferences);

    return () => {
      window.removeEventListener("storage", syncPreferences);
      window.removeEventListener(PREFERENCES_EVENT_NAME, syncPreferences);
    };
  }, []);

  return null;
}
