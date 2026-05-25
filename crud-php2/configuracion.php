<?php
require_once __DIR__ . '/includes/security.php';
require_once __DIR__ . '/conexion.php';
require_once __DIR__ . '/includes/preferences.php';

safe_session_start();

if (!isset($_SESSION['user_id'])) {
    $redirect = urlencode('/crud-php2/configuracion.php');
    header('Location: /crud-php2/login.php?redirect=' . $redirect);
    exit;
}

$preferences = parking_sv_load_preferences($conex);
$current_language = $preferences['language'];
$page_title_key = 'settings.page_title';
$page_title = pref_t($page_title_key, $current_language);
$body_class = 'page-configuracion';
$page_scripts = ['/crud-php2/assets/js/pages/configuracion.js'];
$feedback = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_csrf_token($_POST['csrf_token'] ?? null);
    $postedLanguage = $_POST['language'] ?? $current_language;
    $requestedLanguage = in_array($postedLanguage, ['es', 'en'], true)
        ? (string) $postedLanguage
        : $current_language;

    try {
        $preferences = parking_sv_save_preferences([
            'theme' => $_POST['theme'] ?? $preferences['theme'],
            'language' => $_POST['language'] ?? $preferences['language'],
            'font_size' => $_POST['font_size'] ?? $preferences['font_size'],
            'location' => isset($_POST['location']) ? 1 : 0,
            'recommendations' => isset($_POST['recommendations']) ? 1 : 0,
            'notifications' => isset($_POST['notifications']) ? 1 : 0,
        ], $conex);

        $current_language = $preferences['language'];
        $page_title = pref_t($page_title_key, $current_language);
        $feedback = [
            'type' => 'success',
            'message' => pref_t('settings.saved', $current_language),
        ];
    } catch (Throwable $exception) {
        $current_language = $requestedLanguage;
        $page_title = pref_t($page_title_key, $current_language);
        $feedback = [
            'type' => 'error',
            'message' => pref_t('settings.error', $current_language),
        ];
    }
}

$csrfToken = csrf_token();
include 'includes/header.php';
?>

<link rel="stylesheet" href="/crud-php2/assets/css/pages/configuracion.css">

<div class="container settings-shell">
    <section class="settings-shell__hero">
        <span class="settings-chip" data-i18n="settings.preview"><?= e(pref_t('settings.preview', $current_language)) ?></span>
        <h1 data-i18n="settings.title"><?= e(pref_t('settings.title', $current_language)) ?></h1>
        <p data-i18n="settings.subtitle"><?= e(pref_t('settings.subtitle', $current_language)) ?></p>
        <small data-i18n="settings.account_only"><?= e(pref_t('settings.account_only', $current_language)) ?></small>
    </section>

    <?php if ($feedback): ?>
        <div class="settings-message settings-message--<?= e($feedback['type']) ?>">
            <?= e($feedback['message']) ?>
        </div>
    <?php endif; ?>

    <form method="post" class="settings-shell__panel" id="settingsForm">
        <input type="hidden" name="csrf_token" value="<?= e($csrfToken) ?>">

        <div class="settings-grid">
            <section class="settings-card">
                <div class="settings-card__header">
                    <h2 data-i18n="settings.appearance"><?= e(pref_t('settings.appearance', $current_language)) ?></h2>
                    <p data-i18n="settings.appearance.desc"><?= e(pref_t('settings.appearance.desc', $current_language)) ?></p>
                </div>

                <div class="settings-group">
                    <div class="settings-group__head">
                        <h3 data-i18n="settings.theme"><?= e(pref_t('settings.theme', $current_language)) ?></h3>
                        <p data-i18n="settings.theme.help"><?= e(pref_t('settings.theme.help', $current_language)) ?></p>
                    </div>
                    <div class="settings-options settings-options--two">
                        <label class="settings-option">
                            <input type="radio" name="theme" value="light" <?= $preferences['theme'] === 'light' ? 'checked' : '' ?>>
                            <span class="settings-option__body">
                                <i class="fas fa-sun"></i>
                                <span data-i18n="settings.light"><?= e(pref_t('settings.light', $current_language)) ?></span>
                            </span>
                        </label>
                        <label class="settings-option">
                            <input type="radio" name="theme" value="dark" <?= $preferences['theme'] === 'dark' ? 'checked' : '' ?>>
                            <span class="settings-option__body">
                                <i class="fas fa-moon"></i>
                                <span data-i18n="settings.dark"><?= e(pref_t('settings.dark', $current_language)) ?></span>
                            </span>
                        </label>
                    </div>
                </div>

                <div class="settings-group">
                    <div class="settings-group__head">
                        <h3 data-i18n="settings.font_size"><?= e(pref_t('settings.font_size', $current_language)) ?></h3>
                    </div>
                    <div class="settings-options settings-options--three">
                        <label class="settings-option">
                            <input type="radio" name="font_size" value="small" <?= $preferences['font_size'] === 'small' ? 'checked' : '' ?>>
                            <span class="settings-option__body">
                                <i class="fas fa-text-height"></i>
                                <span data-i18n="settings.font.small"><?= e(pref_t('settings.font.small', $current_language)) ?></span>
                            </span>
                        </label>
                        <label class="settings-option">
                            <input type="radio" name="font_size" value="medium" <?= $preferences['font_size'] === 'medium' ? 'checked' : '' ?>>
                            <span class="settings-option__body">
                                <i class="fas fa-text-height"></i>
                                <span data-i18n="settings.font.medium"><?= e(pref_t('settings.font.medium', $current_language)) ?></span>
                            </span>
                        </label>
                        <label class="settings-option">
                            <input type="radio" name="font_size" value="large" <?= $preferences['font_size'] === 'large' ? 'checked' : '' ?>>
                            <span class="settings-option__body">
                                <i class="fas fa-text-height"></i>
                                <span data-i18n="settings.font.large"><?= e(pref_t('settings.font.large', $current_language)) ?></span>
                            </span>
                        </label>
                    </div>
                </div>

                <div class="settings-group">
                    <div class="settings-group__head">
                        <h3 data-i18n="settings.language"><?= e(pref_t('settings.language', $current_language)) ?></h3>
                        <p data-i18n="settings.language.help"><?= e(pref_t('settings.language.help', $current_language)) ?></p>
                    </div>
                    <div class="settings-options settings-options--two">
                        <label class="settings-option">
                            <input type="radio" name="language" value="es" <?= $preferences['language'] === 'es' ? 'checked' : '' ?>>
                            <span class="settings-option__body">
                                <span class="settings-flag" aria-hidden="true">ES</span>
                                <span data-i18n="settings.language.es"><?= e(pref_t('settings.language.es', $current_language)) ?></span>
                            </span>
                        </label>
                        <label class="settings-option">
                            <input type="radio" name="language" value="en" <?= $preferences['language'] === 'en' ? 'checked' : '' ?>>
                            <span class="settings-option__body">
                                <span class="settings-flag" aria-hidden="true">EN</span>
                                <span data-i18n="settings.language.en"><?= e(pref_t('settings.language.en', $current_language)) ?></span>
                            </span>
                        </label>
                    </div>
                </div>
            </section>

            <section class="settings-card">
                <div class="settings-card__header">
                    <h2 data-i18n="settings.preferences"><?= e(pref_t('settings.preferences', $current_language)) ?></h2>
                    <p data-i18n="settings.preferences.desc"><?= e(pref_t('settings.preferences.desc', $current_language)) ?></p>
                </div>

                <div class="settings-switches">
                    <label class="settings-switch">
                        <span class="settings-switch__copy">
                            <strong data-i18n="settings.location"><?= e(pref_t('settings.location', $current_language)) ?></strong>
                            <small data-i18n="settings.location.help"><?= e(pref_t('settings.location.help', $current_language)) ?></small>
                        </span>
                        <span class="switch">
                            <input type="checkbox" name="location" <?= !empty($preferences['location']) ? 'checked' : '' ?>>
                            <span class="slider"></span>
                        </span>
                    </label>

                    <label class="settings-switch">
                        <span class="settings-switch__copy">
                            <strong data-i18n="settings.recommendations"><?= e(pref_t('settings.recommendations', $current_language)) ?></strong>
                            <small data-i18n="settings.recommendations.help"><?= e(pref_t('settings.recommendations.help', $current_language)) ?></small>
                        </span>
                        <span class="switch">
                            <input type="checkbox" name="recommendations" <?= !empty($preferences['recommendations']) ? 'checked' : '' ?>>
                            <span class="slider"></span>
                        </span>
                    </label>

                    <label class="settings-switch">
                        <span class="settings-switch__copy">
                            <strong data-i18n="settings.notifications"><?= e(pref_t('settings.notifications', $current_language)) ?></strong>
                            <small data-i18n="settings.notifications.help"><?= e(pref_t('settings.notifications.help', $current_language)) ?></small>
                        </span>
                        <span class="switch">
                            <input type="checkbox" name="notifications" <?= !empty($preferences['notifications']) ? 'checked' : '' ?>>
                            <span class="slider"></span>
                        </span>
                    </label>
                </div>
            </section>
        </div>

        <div class="settings-actions">
            <button type="submit" class="settings-save-btn">
                <i class="fas fa-save"></i>
                <span data-i18n="settings.save"><?= e(pref_t('settings.save', $current_language)) ?></span>
            </button>
        </div>
    </form>
</div>

<?php include 'includes/footer.php'; ?>
