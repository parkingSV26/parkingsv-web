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

export type SiteDictionary = {
  brandName: string;
  closeModal: string;
  commonBack: string;
  footerCopyright: string;
  footerFollow: string;
  loginEmailPlaceholder: string;
  loginPasswordPlaceholder: string;
  navAbout: string;
  navHome: string;
  navCloseMenu: string;
  navMenuToggle: string;
  navParkings: string;
  sessionCreateAccount: string;
  sessionFeatureNotificationsDesc: string;
  sessionFeatureNotificationsTitle: string;
  sessionFeaturePersonalizationDesc: string;
  sessionFeaturePersonalizationTitle: string;
  sessionFeatureReservationsDesc: string;
  sessionFeatureReservationsTitle: string;
  sessionFeatureSavedDesc: string;
  sessionFeatureSavedTitle: string;
  sessionGuest: string;
  sessionLogin: string;
  sessionNoAccount: string;
  sessionSubtitle: string;
  sessionTitle: string;
  signupBirthDate: string;
  signupBusinessNamePlaceholder: string;
  signupCustomer: string;
  signupEmailPlaceholder: string;
  signupLastNamePlaceholder: string;
  signupNamePlaceholder: string;
  signupOwner: string;
  signupPasswordPlaceholder: string;
  signupPhonePlaceholder: string;
  signupRolePlaceholder: string;
  signupRolePrompt: string;
  signupSubmit: string;
  userAccount: string;
  userCustomerRole: string;
  userLogout: string;
  userMyParkings: string;
  userNotifications: string;
  userReservations: string;
  userSaved: string;
  userSettings: string;
  userOwnerRole: string;
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

export const siteDictionaries: Record<PreferenceLanguage, SiteDictionary> = {
  es: {
    brandName: "Parking SV",
    closeModal: "Cerrar modal",
    commonBack: "Volver",
    footerCopyright: "Copyright © 2024 - 2026 Parking SV",
    footerFollow: "Síguenos en nuestras redes sociales",
    loginEmailPlaceholder: "Correo electrónico",
    loginPasswordPlaceholder: "Contraseña",
    navAbout: "Sobre nosotros",
    navHome: "Inicio",
    navCloseMenu: "Cerrar menú",
    navMenuToggle: "Abrir menú",
    navParkings: "Parqueos",
    sessionCreateAccount: "Crear una cuenta",
    sessionFeatureNotificationsDesc: "Alertas de disponibilidad y promociones",
    sessionFeatureNotificationsTitle: "Notificaciones",
    sessionFeaturePersonalizationDesc: "Adaptamos tu experiencia a tus preferencias",
    sessionFeaturePersonalizationTitle: "Personalización total",
    sessionFeatureReservationsDesc: "Asegura tu espacio antes de llegar",
    sessionFeatureReservationsTitle: "Reservas anticipadas",
    sessionFeatureSavedDesc: "Guarda tus parqueos preferidos",
    sessionFeatureSavedTitle: "Organiza favoritos",
    sessionGuest: "Explorar como invitado",
    sessionLogin: "Iniciar sesión",
    sessionNoAccount: "¿No tienes cuenta?",
    sessionSubtitle: "Inicia sesión para desbloquear estos beneficios exclusivos",
    sessionTitle: "No iniciaste sesión",
    signupBirthDate: "Fecha de nacimiento",
    signupBusinessNamePlaceholder: "Nombre del negocio",
    signupCustomer: "Cliente",
    signupEmailPlaceholder: "Correo electrónico",
    signupLastNamePlaceholder: "Apellidos",
    signupNamePlaceholder: "Nombre",
    signupOwner: "Propietario",
    signupPasswordPlaceholder: "Contraseña",
    signupPhonePlaceholder: "Teléfono",
    signupRolePlaceholder: "Selecciona una opción",
    signupRolePrompt: "¿Eres cliente o propietario?",
    signupSubmit: "Registrarse",
    userAccount: "Mi cuenta",
    userCustomerRole: "Cliente",
    userLogout: "Cerrar sesión",
    userMyParkings: "Mis parqueos",
    userNotifications: "Notificaciones",
    userReservations: "Mis reservas",
    userSaved: "Guardados",
    userSettings: "Configuración",
    userOwnerRole: "Propietario",
  },
  en: {
    brandName: "Parking SV",
    closeModal: "Close modal",
    commonBack: "Back",
    footerCopyright: "Copyright © 2024 - 2026 Parking SV",
    footerFollow: "Follow us on social media",
    loginEmailPlaceholder: "Email address",
    loginPasswordPlaceholder: "Password",
    navAbout: "About us",
    navHome: "Home",
    navCloseMenu: "Close menu",
    navMenuToggle: "Open menu",
    navParkings: "Parkings",
    sessionCreateAccount: "Create an account",
    sessionFeatureNotificationsDesc: "Availability alerts and promotions",
    sessionFeatureNotificationsTitle: "Notifications",
    sessionFeaturePersonalizationDesc: "We adapt your experience to your preferences",
    sessionFeaturePersonalizationTitle: "Full personalization",
    sessionFeatureReservationsDesc: "Secure your spot before you arrive",
    sessionFeatureReservationsTitle: "Advance reservations",
    sessionFeatureSavedDesc: "Save your favorite parkings",
    sessionFeatureSavedTitle: "Organize favorites",
    sessionGuest: "Browse as guest",
    sessionLogin: "Sign in",
    sessionNoAccount: "Don't have an account?",
    sessionSubtitle: "Sign in to unlock these exclusive benefits",
    sessionTitle: "You are not signed in",
    signupBirthDate: "Birth date",
    signupBusinessNamePlaceholder: "Business name",
    signupCustomer: "Customer",
    signupEmailPlaceholder: "Email address",
    signupLastNamePlaceholder: "Last name",
    signupNamePlaceholder: "First name",
    signupOwner: "Owner",
    signupPasswordPlaceholder: "Password",
    signupPhonePlaceholder: "Phone",
    signupRolePlaceholder: "Select an option",
    signupRolePrompt: "Are you a customer or an owner?",
    signupSubmit: "Sign up",
    userAccount: "My account",
    userCustomerRole: "Customer",
    userLogout: "Log out",
    userMyParkings: "My parkings",
    userNotifications: "Notifications",
    userReservations: "My reservations",
    userSaved: "Saved",
    userSettings: "Settings",
    userOwnerRole: "Owner",
  },
};

type GlobalWindow = Window &
  typeof globalThis & {
    PARKING_SV_I18N?: Record<PreferenceLanguage, SettingsDictionary & SiteDictionary>;
  };

export function getSiteDictionary(language: PreferenceLanguage) {
  return siteDictionaries[language] ?? siteDictionaries.es;
}

export function translateDocument(language: PreferenceLanguage) {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return;
  }

  const dictionary = getSiteDictionary(language);
  const globalWindow = window as GlobalWindow;

  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");

    if (!key || !(key in dictionary)) {
      return;
    }

    element.textContent = dictionary[key as keyof typeof dictionary];
  });

  document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-i18n-placeholder]").forEach(
    (element) => {
      const key = element.getAttribute("data-i18n-placeholder");

      if (!key || !(key in dictionary)) {
        return;
      }

      element.setAttribute("placeholder", dictionary[key as keyof typeof dictionary]);
    },
  );

  document.querySelectorAll<HTMLElement>("[data-i18n-aria-label]").forEach((element) => {
    const key = element.getAttribute("data-i18n-aria-label");

    if (!key || !(key in dictionary)) {
      return;
    }

    element.setAttribute("aria-label", dictionary[key as keyof typeof dictionary]);
  });

  document.querySelectorAll<HTMLElement>(".universal-back-text").forEach((element) => {
    element.textContent = dictionary.commonBack;
  });

  if (globalWindow.PARKING_SV_I18N) {
    const pageDictionary = globalWindow.PARKING_SV_I18N[language] ?? globalWindow.PARKING_SV_I18N.es;

    document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((element) => {
      const key = element.getAttribute("data-i18n");

      if (!key || !(key in pageDictionary)) {
        return;
      }

      element.textContent = pageDictionary[key as keyof typeof pageDictionary];
    });
  }
}

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

  translateDocument(normalized.language);
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
