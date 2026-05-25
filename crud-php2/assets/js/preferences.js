(function () {
  const defaultPreferences = {
    theme: 'light',
    language: 'es',
    font_size: 'medium',
    notifications: 1,
    recommendations: 1,
    location: 1
  };

  function getTranslations() {
    return window.PARKING_SV_I18N || {};
  }

  function normalizePreferences(input) {
    const preferences = { ...defaultPreferences, ...(input || {}) };

    if (!['light', 'dark'].includes(preferences.theme)) {
      preferences.theme = defaultPreferences.theme;
    }

    if (!['es', 'en'].includes(preferences.language)) {
      preferences.language = defaultPreferences.language;
    }

    if (!['small', 'medium', 'large'].includes(preferences.font_size)) {
      preferences.font_size = defaultPreferences.font_size;
    }

    preferences.notifications = preferences.notifications ? 1 : 0;
    preferences.recommendations = preferences.recommendations ? 1 : 0;
    preferences.location = preferences.location ? 1 : 0;

    return preferences;
  }

  function setDatasetPreferences(preferences) {
    const html = document.documentElement;
    const body = document.body;

    html.dataset.theme = preferences.theme;
    html.dataset.fontSize = preferences.font_size;
    html.dataset.language = preferences.language;
    html.lang = preferences.language;

    if (body) {
      body.dataset.theme = preferences.theme;
      body.dataset.fontSize = preferences.font_size;
      body.dataset.language = preferences.language;
    }
  }

  function translateDocument(language) {
    const translations = getTranslations();
    const dictionary = translations[language] || translations.es || {};

    document.querySelectorAll('[data-i18n]').forEach((element) => {
      const key = element.getAttribute('data-i18n');
      if (key && Object.prototype.hasOwnProperty.call(dictionary, key)) {
        element.textContent = dictionary[key];
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
      const key = element.getAttribute('data-i18n-placeholder');
      if (key && Object.prototype.hasOwnProperty.call(dictionary, key)) {
        element.setAttribute('placeholder', dictionary[key]);
      }
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
      const key = element.getAttribute('data-i18n-aria-label');
      if (key && Object.prototype.hasOwnProperty.call(dictionary, key)) {
        element.setAttribute('aria-label', dictionary[key]);
      }
    });

    document.querySelectorAll('.universal-back-text').forEach((element) => {
      if (dictionary['common.back']) {
        element.textContent = dictionary['common.back'];
      }
    });

    if (document.body && document.body.dataset.pageTitleKey) {
      const titleKey = document.body.dataset.pageTitleKey;
      if (dictionary[titleKey]) {
        document.title = dictionary[titleKey];
      }
    }
  }

  function applyPreferences(input) {
    const preferences = normalizePreferences(input || window.PARKING_SV_PREFERENCES || defaultPreferences);
    window.PARKING_SV_PREFERENCES = preferences;
    setDatasetPreferences(preferences);
    translateDocument(preferences.language);
    return preferences;
  }

  window.ParkingSVPreferences = {
    applyPreferences,
    normalizePreferences,
    translateDocument
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      applyPreferences(window.PARKING_SV_PREFERENCES || defaultPreferences);
    });
  } else {
    applyPreferences(window.PARKING_SV_PREFERENCES || defaultPreferences);
  }
})();
