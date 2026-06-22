"use client";

import { useEffect } from "react";
import {
  PREFERENCES_EVENT_NAME,
  siteDictionaries,
  applyPreferencesToDocument,
  readStoredPreferences,
} from "@/app/settings/_lib/preferences";

export default function SettingsBridge() {
  useEffect(() => {
    const globalWindow = window as Window & {
      PARKING_SV_I18N?: typeof siteDictionaries;
    };

    const syncPreferences = () => {
      // Reapply preferences to the document whenever another tab or screen changes them.
      applyPreferencesToDocument(readStoredPreferences());
    };

    globalWindow.PARKING_SV_I18N = {
      es: {
        ...siteDictionaries.es,
      },
      en: {
        ...siteDictionaries.en,
      },
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
