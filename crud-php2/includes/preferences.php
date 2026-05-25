<?php

require_once __DIR__ . '/security.php';

const PARKING_SV_PREFERENCES_COOKIE = 'parking_sv_preferences';
const PARKING_SV_PREFERENCES_SESSION_KEY = 'parking_sv_preferences';

function parking_sv_default_preferences(): array
{
    return [
        'theme' => 'light',
        'language' => 'es',
        'font_size' => 'medium',
        'notifications' => 1,
        'recommendations' => 1,
        'location' => 1,
    ];
}

function parking_sv_translations(): array
{
    return [
        'es' => [
            'brand.name' => 'Parking SV',
            'nav.home' => 'Inicio',
            'nav.parkings' => 'Parqueos',
            'nav.about' => 'Sobre nosotros',
            'nav.menu_toggle' => 'Abrir menu',
            'user.account' => 'Mi cuenta',
            'user.reservations' => 'Mis reservas',
            'user.saved' => 'Guardados',
            'user.notifications' => 'Notificaciones',
            'user.settings' => 'Configuracion',
            'session.title' => 'No iniciaste sesion',
            'session.subtitle' => 'Inicia sesion para desbloquear estos beneficios exclusivos',
            'session.feature.personalization.title' => 'Personalizacion total',
            'session.feature.personalization.desc' => 'Adaptamos tu experiencia a tus preferencias',
            'session.feature.saved.title' => 'Organiza favoritos',
            'session.feature.saved.desc' => 'Guarda tus parqueos preferidos',
            'session.feature.notifications.title' => 'Notificaciones',
            'session.feature.notifications.desc' => 'Alertas de disponibilidad y promociones',
            'session.feature.reservations.title' => 'Reservas anticipadas',
            'session.feature.reservations.desc' => 'Asegura tu espacio antes de llegar',
            'session.login' => 'Iniciar sesion',
            'session.guest' => 'Explorar como invitado',
            'session.no_account' => 'No tienes cuenta?',
            'session.create_account' => 'Crear una cuenta',
            'footer.ad.eyebrow' => 'Espacio Comercial',
            'footer.ad.title' => 'Anunciate aqui',
            'footer.ad.desc' => 'Parking SV puede destacar negocios cercanos, servicios vehiculares y marcas locales sin interrumpir la experiencia.',
            'footer.ad.cta' => 'Quiero anunciarme',
            'footer.follow' => 'Siguenos en nuestras redes sociales!',
            'common.back' => 'Volver',
            'settings.page_title' => 'Parking SV - Configuracion',
            'settings.title' => 'Configura tu experiencia',
            'settings.subtitle' => 'Guarda tus preferencias de apariencia e idioma para usarlas en todo el sitio.',
            'settings.account_only' => 'Estas preferencias se guardan en tu cuenta y tambien se aplican en este navegador.',
            'settings.preview' => 'Vista previa inmediata',
            'settings.appearance' => 'Apariencia',
            'settings.appearance.desc' => 'Ajusta el tema, el idioma y la lectura.',
            'settings.theme' => 'Tema',
            'settings.theme.help' => 'Activa el modo oscuro para una interfaz mas comoda de noche.',
            'settings.light' => 'Claro',
            'settings.dark' => 'Oscuro',
            'settings.font_size' => 'Tamano de letra',
            'settings.font.small' => 'Pequeno',
            'settings.font.medium' => 'Mediano',
            'settings.font.large' => 'Grande',
            'settings.language' => 'Idioma',
            'settings.language.help' => 'Elige si quieres ver la interfaz en espanol o en ingles.',
            'settings.language.es' => 'Espanol',
            'settings.language.en' => 'English',
            'settings.preferences' => 'Preferencias',
            'settings.preferences.desc' => 'Controla como Parking SV personaliza tu experiencia.',
            'settings.location' => 'Ubicacion',
            'settings.location.help' => 'Permite usar tu ubicacion para resultados y recomendaciones cercanas.',
            'settings.recommendations' => 'Recomendaciones',
            'settings.recommendations.help' => 'Muestra sugerencias personalizadas segun tu actividad.',
            'settings.notifications' => 'Notificaciones',
            'settings.notifications.help' => 'Mantiene avisos y recordatorios activos en tu cuenta.',
            'settings.save' => 'Guardar cambios',
            'settings.saved' => 'Configuracion guardada con exito.',
            'settings.error' => 'No se pudieron guardar los cambios.',
        ],
        'en' => [
            'brand.name' => 'Parking SV',
            'nav.home' => 'Home',
            'nav.parkings' => 'Parkings',
            'nav.about' => 'About us',
            'nav.menu_toggle' => 'Open menu',
            'user.account' => 'My account',
            'user.reservations' => 'My reservations',
            'user.saved' => 'Saved',
            'user.notifications' => 'Notifications',
            'user.settings' => 'Settings',
            'session.title' => 'You are not signed in',
            'session.subtitle' => 'Sign in to unlock these exclusive benefits',
            'session.feature.personalization.title' => 'Full personalization',
            'session.feature.personalization.desc' => 'We adapt your experience to your preferences',
            'session.feature.saved.title' => 'Organize favorites',
            'session.feature.saved.desc' => 'Save your favorite parkings',
            'session.feature.notifications.title' => 'Notifications',
            'session.feature.notifications.desc' => 'Availability alerts and promotions',
            'session.feature.reservations.title' => 'Advance reservations',
            'session.feature.reservations.desc' => 'Secure your spot before you arrive',
            'session.login' => 'Sign in',
            'session.guest' => 'Browse as guest',
            'session.no_account' => "Don't have an account?",
            'session.create_account' => 'Create an account',
            'footer.ad.eyebrow' => 'Commercial space',
            'footer.ad.title' => 'Advertise here',
            'footer.ad.desc' => 'Parking SV can feature nearby businesses, vehicle services, and local brands without interrupting the experience.',
            'footer.ad.cta' => 'I want to advertise',
            'footer.follow' => 'Follow us on social media!',
            'common.back' => 'Back',
            'settings.page_title' => 'Parking SV - Settings',
            'settings.title' => 'Set up your experience',
            'settings.subtitle' => 'Save your appearance and language preferences to use them across the site.',
            'settings.account_only' => 'These preferences are saved to your account and also applied in this browser.',
            'settings.preview' => 'Live preview',
            'settings.appearance' => 'Appearance',
            'settings.appearance.desc' => 'Adjust theme, language, and reading size.',
            'settings.theme' => 'Theme',
            'settings.theme.help' => 'Enable dark mode for a more comfortable interface at night.',
            'settings.light' => 'Light',
            'settings.dark' => 'Dark',
            'settings.font_size' => 'Font size',
            'settings.font.small' => 'Small',
            'settings.font.medium' => 'Medium',
            'settings.font.large' => 'Large',
            'settings.language' => 'Language',
            'settings.language.help' => 'Choose whether you want the interface in Spanish or English.',
            'settings.language.es' => 'Spanish',
            'settings.language.en' => 'English',
            'settings.preferences' => 'Preferences',
            'settings.preferences.desc' => 'Control how Parking SV personalizes your experience.',
            'settings.location' => 'Location',
            'settings.location.help' => 'Allow using your location for nearby results and recommendations.',
            'settings.recommendations' => 'Recommendations',
            'settings.recommendations.help' => 'Show personalized suggestions based on your activity.',
            'settings.notifications' => 'Notifications',
            'settings.notifications.help' => 'Keep alerts and reminders active in your account.',
            'settings.save' => 'Save changes',
            'settings.saved' => 'Settings saved successfully.',
            'settings.error' => 'Your changes could not be saved.',
        ],
    ];
}

function pref_t(string $key, ?string $language = null): string
{
    $translations = parking_sv_translations();
    $resolvedLanguage = $language ?: (parking_sv_load_preferences()['language'] ?? 'es');

    if (isset($translations[$resolvedLanguage][$key])) {
        return $translations[$resolvedLanguage][$key];
    }

    return $translations['es'][$key] ?? $key;
}

function parking_sv_sanitize_preferences(array $input): array
{
    $defaults = parking_sv_default_preferences();
    $themeValue = $input['theme'] ?? $defaults['theme'];
    $languageValue = $input['language'] ?? $defaults['language'];
    $fontSizeValue = $input['font_size'] ?? $defaults['font_size'];

    $theme = in_array($themeValue, ['light', 'dark'], true)
        ? (string) $themeValue
        : $defaults['theme'];

    $language = in_array($languageValue, ['es', 'en'], true)
        ? (string) $languageValue
        : $defaults['language'];

    $fontSize = in_array($fontSizeValue, ['small', 'medium', 'large'], true)
        ? (string) $fontSizeValue
        : $defaults['font_size'];

    return [
        'theme' => $theme,
        'language' => $language,
        'font_size' => $fontSize,
        'notifications' => !empty($input['notifications']) ? 1 : 0,
        'recommendations' => !empty($input['recommendations']) ? 1 : 0,
        'location' => !empty($input['location']) ? 1 : 0,
    ];
}

function parking_sv_preferences_cookie_payload(array $preferences): string
{
    return json_encode($preferences, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '{}';
}

function parking_sv_write_preferences_cookie(array $preferences): void
{
    setcookie(PARKING_SV_PREFERENCES_COOKIE, parking_sv_preferences_cookie_payload($preferences), [
        'expires' => time() + (86400 * 365),
        'path' => '/',
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => false,
        'samesite' => 'Lax',
    ]);
}

function parking_sv_preferences_table_exists(?mysqli $conex): bool
{
    if (!$conex instanceof mysqli) {
        return false;
    }

    $result = $conex->query("SHOW TABLES LIKE 'user_preferences'");
    $exists = $result instanceof mysqli_result && $result->num_rows > 0;

    if ($result instanceof mysqli_result) {
        $result->close();
    }

    return $exists;
}

function parking_sv_ensure_preferences_table(mysqli $conex): void
{
    $sql = "CREATE TABLE IF NOT EXISTS user_preferences (
                user_id INT(11) NOT NULL,
                theme ENUM('light','dark') NOT NULL DEFAULT 'light',
                language VARCHAR(5) NOT NULL DEFAULT 'es',
                font_size ENUM('small','medium','large') NOT NULL DEFAULT 'medium',
                notifications_enabled TINYINT(1) NOT NULL DEFAULT 1,
                recommendations_enabled TINYINT(1) NOT NULL DEFAULT 1,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id),
                CONSTRAINT fk_user_preferences_user
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";

    $conex->query($sql);
}

function parking_sv_load_preferences(?mysqli $conex = null): array
{
    safe_session_start();

    $preferences = parking_sv_default_preferences();
    $userId = isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : 0;

    if ($userId > 0 && $conex instanceof mysqli && parking_sv_preferences_table_exists($conex)) {
        $stmt = $conex->prepare("SELECT theme, language, font_size, notifications_enabled, recommendations_enabled
                                 FROM user_preferences
                                 WHERE user_id = ?
                                 LIMIT 1");
        $row = null;

        if ($stmt instanceof mysqli_stmt) {
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $row = $stmt->get_result()->fetch_assoc();
            $stmt->close();
        }

        if ($row) {
            $preferences = array_merge($preferences, [
                'theme' => $row['theme'],
                'language' => $row['language'],
                'font_size' => $row['font_size'],
                'notifications' => (int) $row['notifications_enabled'],
                'recommendations' => (int) $row['recommendations_enabled'],
            ]);
        }

        $locationStmt = $conex->prepare("SELECT location_permission FROM users WHERE id = ? LIMIT 1");
        $locationRow = null;

        if ($locationStmt instanceof mysqli_stmt) {
            $locationStmt->bind_param("i", $userId);
            $locationStmt->execute();
            $locationRow = $locationStmt->get_result()->fetch_assoc();
            $locationStmt->close();
        }

        if ($locationRow) {
            $preferences['location'] = (int) $locationRow['location_permission'];
        }
    }

    if (!empty($_COOKIE[PARKING_SV_PREFERENCES_COOKIE])) {
        $cookiePreferences = json_decode((string) $_COOKIE[PARKING_SV_PREFERENCES_COOKIE], true);
        if (is_array($cookiePreferences)) {
            $preferences = array_merge($preferences, parking_sv_sanitize_preferences($cookiePreferences));
        }
    }

    if (!empty($_SESSION[PARKING_SV_PREFERENCES_SESSION_KEY]) && is_array($_SESSION[PARKING_SV_PREFERENCES_SESSION_KEY])) {
        $preferences = array_merge($preferences, parking_sv_sanitize_preferences($_SESSION[PARKING_SV_PREFERENCES_SESSION_KEY]));
    }

    $preferences = parking_sv_sanitize_preferences($preferences);
    $_SESSION[PARKING_SV_PREFERENCES_SESSION_KEY] = $preferences;

    return $preferences;
}

function parking_sv_save_preferences(array $input, ?mysqli $conex = null): array
{
    safe_session_start();

    $currentPreferences = parking_sv_load_preferences($conex);
    $preferences = parking_sv_sanitize_preferences(array_merge($currentPreferences, $input));
    $_SESSION[PARKING_SV_PREFERENCES_SESSION_KEY] = $preferences;
    parking_sv_write_preferences_cookie($preferences);

    $userId = isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : 0;

    if ($userId > 0 && $conex instanceof mysqli) {
        parking_sv_ensure_preferences_table($conex);

        $stmt = $conex->prepare("INSERT INTO user_preferences (user_id, theme, language, font_size, notifications_enabled, recommendations_enabled)
                                 VALUES (?, ?, ?, ?, ?, ?)
                                 ON DUPLICATE KEY UPDATE
                                     theme = VALUES(theme),
                                     language = VALUES(language),
                                     font_size = VALUES(font_size),
                                     notifications_enabled = VALUES(notifications_enabled),
                                     recommendations_enabled = VALUES(recommendations_enabled)");
        if (!($stmt instanceof mysqli_stmt)) {
            throw new RuntimeException('No se pudieron preparar las preferencias del usuario.');
        }

        $stmt->bind_param(
            "isssii",
            $userId,
            $preferences['theme'],
            $preferences['language'],
            $preferences['font_size'],
            $preferences['notifications'],
            $preferences['recommendations']
        );
        $stmt->execute();
        $stmt->close();

        $locationStmt = $conex->prepare("UPDATE users SET location_permission = ? WHERE id = ?");
        if (!($locationStmt instanceof mysqli_stmt)) {
            throw new RuntimeException('No se pudo actualizar la preferencia de ubicacion.');
        }

        $locationStmt->bind_param("ii", $preferences['location'], $userId);
        $locationStmt->execute();
        $locationStmt->close();
    }

    return $preferences;
}
