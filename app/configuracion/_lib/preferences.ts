export type PreferenceTheme = "light" | "dark";
export type PreferenceLanguage = "es" | "en";
export type PreferenceFontSize = "small" | "medium" | "large";

export type ParkingPreferences = {
  fontSize: PreferenceFontSize;
  language: PreferenceLanguage;
  location: boolean;
  notifications: boolean;
  recommendations: boolean;
  theme: PreferenceTheme;
};

export type SettingsDictionary = {
  accountOnly: string;
  appearance: string;
  appearanceDesc: string;
  dark: string;
  fontLarge: string;
  fontMedium: string;
  fontSize: string;
  fontSmall: string;
  language: string;
  languageEn: string;
  languageEs: string;
  languageHelp: string;
  light: string;
  location: string;
  locationHelp: string;
  notifications: string;
  notificationsHelp: string;
  preferences: string;
  preferencesDesc: string;
  preview: string;
  recommendations: string;
  recommendationsHelp: string;
  save: string;
  saved: string;
  saveHint: string;
  subtitle: string;
  theme: string;
  themeHelp: string;
  title: string;
  unsaved: string;
};

const PREFERENCES_STORAGE_KEY = "parking_sv_preferences";
export const PREFERENCES_EVENT_NAME = "parking-sv-preferences-change";

export const defaultPreferences: ParkingPreferences = {
  theme: "light",
  language: "es",
  fontSize: "medium",
  notifications: true,
  recommendations: true,
  location: true,
};

// El diccionario centraliza los textos para que la pantalla de configuración cambie de idioma sin duplicar UI.
export const settingsDictionaries: Record<PreferenceLanguage, SettingsDictionary> = {
  es: {
    title: "Configura tu experiencia",
    subtitle: "Guarda tus preferencias de apariencia e idioma para usarlas en todo el sitio.",
    accountOnly: "Estas preferencias se guardan localmente por ahora y se aplican en este navegador.",
    preview: "Vista previa inmediata",
    appearance: "Apariencia",
    appearanceDesc: "Ajusta el tema, el idioma y la lectura.",
    theme: "Tema",
    themeHelp: "Activa el modo oscuro para una interfaz más cómoda de noche.",
    light: "Claro",
    dark: "Oscuro",
    fontSize: "Tamaño de letra",
    fontSmall: "Pequeño",
    fontMedium: "Mediano",
    fontLarge: "Grande",
    language: "Idioma",
    languageHelp: "Elige si quieres ver la interfaz en español o en ingles.",
    languageEs: "Español",
    languageEn: "English",
    preferences: "Preferencias",
    preferencesDesc: "Controla cómo Parking SV personaliza tu experiencia.",
    location: "Ubicación",
    locationHelp: "Permite usar tu ubicación para resultados y recomendaciones cercanas.",
    recommendations: "Recomendaciones",
    recommendationsHelp: "Muestra sugerencias personalizadas según tu actividad.",
    notifications: "Notificaciones",
    notificationsHelp: "Mantiene avisos y recordatorios activos en tu cuenta.",
    save: "Guardar cambios",
    saved: "Configuración guardada con exito.",
    unsaved: "Tienes cambios sin guardar.",
    saveHint: "La vista previa ya se está aplicando, pero recuerda guardar para conservar estos ajustes.",
  },
  en: {
    title: "Set up your experience",
    subtitle: "Save your appearance and language preferences to use them across the site.",
    accountOnly: "These preferences are currently stored locally and applied in this browser.",
    preview: "Live preview",
    appearance: "Appearance",
    appearanceDesc: "Adjust theme, language, and reading size.",
    theme: "Theme",
    themeHelp: "Enable dark mode for a more comfortable interface at night.",
    light: "Light",
    dark: "Dark",
    fontSize: "Font size",
    fontSmall: "Small",
    fontMedium: "Medium",
    fontLarge: "Large",
    language: "Language",
    languageHelp: "Choose whether you want the interface in Spanish or English.",
    languageEs: "Spanish",
    languageEn: "English",
    preferences: "Preferences",
    preferencesDesc: "Control how Parking SV personalizes your experience.",
    location: "Location",
    locationHelp: "Allow using your location for nearby results and recommendations.",
    recommendations: "Recommendations",
    recommendationsHelp: "Show personalized suggestions based on your activity.",
    notifications: "Notifications",
    notificationsHelp: "Keep alerts and reminders active in your account.",
    save: "Save changes",
    saved: "Settings saved successfully.",
    unsaved: "You have unsaved changes.",
    saveHint: "The preview is already active, but remember to save to keep these changes.",
  },
};

export function getUserPreferencesStorageKey(userId: number) {
  return `${PREFERENCES_STORAGE_KEY}:${userId}`;
}

export function normalizePreferences(input: Partial<Record<string, unknown>> | null | undefined) {
  const candidate = input ?? {};
  const theme = candidate.theme === "dark" ? "dark" : "light";
  const language = candidate.language === "en" ? "en" : "es";
  const fontSize =
    candidate.fontSize === "small" || candidate.fontSize === "large"
      ? candidate.fontSize
      : candidate.font_size === "small" || candidate.font_size === "large"
        ? candidate.font_size
        : "medium";

  return {
    theme,
    language,
    fontSize,
    notifications: normalizeBoolean(candidate.notifications, defaultPreferences.notifications),
    recommendations: normalizeBoolean(candidate.recommendations, defaultPreferences.recommendations),
    location: normalizeBoolean(candidate.location, defaultPreferences.location),
  } satisfies ParkingPreferences;
}

export function readStoredPreferences(userId?: number) {
  if (typeof window === "undefined") {
    return defaultPreferences;
  }

  // Primero intentamos una clave por usuario y luego el fallback global del navegador.
  const candidateKeys = [
    typeof userId === "number" ? getUserPreferencesStorageKey(userId) : null,
    PREFERENCES_STORAGE_KEY,
  ].filter((key): key is string => Boolean(key));

  for (const key of candidateKeys) {
    try {
      const rawValue = window.localStorage.getItem(key);

      if (rawValue) {
        return normalizePreferences(JSON.parse(rawValue) as Record<string, unknown>);
      }
    } catch {
      // Si localStorage o el JSON falla, seguimos con el siguiente origen.
    }
  }

  return defaultPreferences;
}

export function persistPreferences(preferences: ParkingPreferences, userId?: number) {
  if (typeof window === "undefined") {
    return false;
  }

  const normalized = normalizePreferences(preferences);

  try {
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(normalized));

    if (typeof userId === "number") {
      window.localStorage.setItem(getUserPreferencesStorageKey(userId), JSON.stringify(normalized));
    }

    applyPreferencesToDocument(normalized);
    window.dispatchEvent(new Event(PREFERENCES_EVENT_NAME));
    return true;
  } catch {
    return false;
  }
}

export function applyPreferencesToDocument(preferences: ParkingPreferences) {
  if (typeof document === "undefined") {
    return;
  }

  // Los data attributes alimentan CSS global y permiten una vista previa inmediata sin recargar.
  const normalized = normalizePreferences(preferences);
  const html = document.documentElement;
  const body = document.body;

  html.dataset.theme = normalized.theme;
  html.dataset.fontSize = normalized.fontSize;
  html.dataset.language = normalized.language;
  html.lang = normalized.language;

  if (body) {
    body.dataset.theme = normalized.theme;
    body.dataset.fontSize = normalized.fontSize;
    body.dataset.language = normalized.language;
  }
}

export function arePreferencesEqual(left: ParkingPreferences, right: ParkingPreferences) {
  return (
    left.theme === right.theme &&
    left.language === right.language &&
    left.fontSize === right.fontSize &&
    left.notifications === right.notifications &&
    left.recommendations === right.recommendations &&
    left.location === right.location
  );
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    return value === "1" || value.toLowerCase() === "true" || value.toLowerCase() === "on";
  }

  return fallback;
}
