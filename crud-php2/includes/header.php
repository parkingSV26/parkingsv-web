<?php
require_once __DIR__ . '/security.php';
require_once __DIR__ . '/preferences.php';

if (!isset($conex) && file_exists(APP_ROOT . '/conexion.php')) {
    require_once APP_ROOT . '/conexion.php';
}

safe_session_start();
send_security_headers();

$is_logged_in = isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
$user_preferences = parking_sv_load_preferences(isset($conex) && $conex instanceof mysqli ? $conex : null);
$current_language = $user_preferences['language'] ?? 'es';
?>
<!DOCTYPE html>
<html lang="<?= e($current_language) ?>" data-theme="<?= e($user_preferences['theme']) ?>" data-font-size="<?= e($user_preferences['font_size']) ?>" data-language="<?= e($current_language) ?>">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= e($page_title ?? 'Parking SV') ?></title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,400;0,700;1,400&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/crud-php2/assets/css/global.css">
  <link rel="stylesheet" href="/crud-php2/assets/css/preferences.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="icon" href="/crud-php2/img sources/Logo_Parking_SV-bg.png">
</head>
<body class="<?php echo e(isset($body_class) ? $body_class : ''); ?> <?php echo $is_logged_in ? 'user-logged-in' : 'user-not-logged-in'; ?>" data-theme="<?= e($user_preferences['theme']) ?>" data-language="<?= e($current_language) ?>" data-font-size="<?= e($user_preferences['font_size']) ?>"<?php if (isset($page_title_key)): ?> data-page-title-key="<?= e($page_title_key) ?>"<?php endif; ?>>
  <header class="navbar">
    <div class="logo">
      <a href="index.php">
        <img src="/crud-php2/img sources/Logo_Parking_SV-bg.png" alt="Logo Parking SV">
      </a>
      <h2 class="name" data-i18n="brand.name"><?= e(pref_t('brand.name', $current_language)) ?></h2>
    </div>

    <button class="navbar-toggle" id="navbarToggle" aria-label="<?= e(pref_t('nav.menu_toggle', $current_language)) ?>" data-i18n-aria-label="nav.menu_toggle">
      <span></span>
      <span></span>
      <span></span>
    </button>

    <?php
    $current_page = basename(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
    $pages = [
        'index.php' => [
            'class' => 'inicio-link',
            'icon' => '/crud-php2/img sources/casa parking 2.png',
            'text' => pref_t('nav.home', $current_language),
            'i18n' => 'nav.home'
        ],
        'parqueos-publicados.php' => [
            'class' => 'parqueos-link',
            'icon' => '/crud-php2/img sources/icon_parqueos_publicados-bg.png',
            'text' => pref_t('nav.parkings', $current_language),
            'i18n' => 'nav.parkings'
        ],
        'about.php' => [
            'class' => 'about-link',
            'icon' => '/crud-php2/img sources/icon_about-bg.png',
            'text' => pref_t('nav.about', $current_language),
            'i18n' => 'nav.about'
        ]
    ];
    ?>

    <nav>
      <ul class="navbar-links">
        <?php foreach ($pages as $page => $data): ?>
        <li class="nav-item">
          <a href="/crud-php2/<?= e($page) ?>"
             class="nav-link <?= e($data['class']) ?> <?= ($current_page == $page || strpos($current_page, $page) !== false) ? 'active' : '' ?>">
            <img class="<?= e(str_replace('-link', '-icon', $data['class'])) ?>"
                 src="<?= e($data['icon']) ?>"
                 alt="Icono <?= e(strtolower($data['text'])) ?>"
                 width="30" height="30">
            <span data-i18n="<?= e($data['i18n']) ?>"><?= e($data['text']) ?></span>
          </a>
        </li>
        <?php endforeach; ?>

        <li class="user-dropdown">
          <a href="#" id="userMenuBtn">
            <?php $profile_picture = $_SESSION['user_profile_picture'] ?? '/crud-php2/assets/images/pfp default.jpeg'; ?>
            <img src="<?= e($profile_picture) ?>"
                 alt="Foto de perfil"
                 class="user-profile-picture"
                 id="userMenuIcon">
          </a>

          <ul class="user-dropdown-menu" id="userDropdown">
            <li><a href="/crud-php2/mi-cuenta.php" class="restricted-link"><i class="fas fa-user"></i> <span data-i18n="user.account"><?= e(pref_t('user.account', $current_language)) ?></span></a></li>
            <li><a href="/crud-php2/mis-reservas.php" class="restricted-link"><i class="fas fa-calendar-check"></i> <span data-i18n="user.reservations"><?= e(pref_t('user.reservations', $current_language)) ?></span></a></li>
            <li><a href="/crud-php2/guardados.php" class="restricted-link"><i class="fas fa-bookmark"></i> <span data-i18n="user.saved"><?= e(pref_t('user.saved', $current_language)) ?></span></a></li>
            <li><a href="/crud-php2/notificaciones.php" class="restricted-link"><i class="fas fa-bell"></i> <span data-i18n="user.notifications"><?= e(pref_t('user.notifications', $current_language)) ?></span></a></li>
            <li><a href="/crud-php2/configuracion.php" class="restricted-link"><i class="fas fa-cog"></i> <span data-i18n="user.settings"><?= e(pref_t('user.settings', $current_language)) ?></span></a></li>
          </ul>
        </li>
      </ul>
    </nav>
  </header>

  <div id="sessionModal" class="session-modal">
    <div class="session-modal-content">
      <div class="session-modal-header">
        <div class="session-modal-icon">
          <img src="/crud-php2/img sources/Locked.png" alt="Bloqueado" class="lock-icon">
        </div>
        <h2 class="session-modal-title" data-i18n="session.title"><?= e(pref_t('session.title', $current_language)) ?></h2>
        <p class="session-modal-subtitle" data-i18n="session.subtitle"><?= e(pref_t('session.subtitle', $current_language)) ?></p>
      </div>

      <div class="session-modal-features-container">
        <div class="features-scroll">
          <div class="session-feature-item">
            <i class="fas fa-user-cog session-feature-icon"></i>
            <div class="session-feature-text">
              <h3 data-i18n="session.feature.personalization.title"><?= e(pref_t('session.feature.personalization.title', $current_language)) ?></h3>
              <p data-i18n="session.feature.personalization.desc"><?= e(pref_t('session.feature.personalization.desc', $current_language)) ?></p>
            </div>
          </div>
          <div class="session-feature-item">
            <i class="fas fa-bookmark session-feature-icon"></i>
            <div class="session-feature-text">
              <h3 data-i18n="session.feature.saved.title"><?= e(pref_t('session.feature.saved.title', $current_language)) ?></h3>
              <p data-i18n="session.feature.saved.desc"><?= e(pref_t('session.feature.saved.desc', $current_language)) ?></p>
            </div>
          </div>
          <div class="session-feature-item">
            <i class="fas fa-bell session-feature-icon"></i>
            <div class="session-feature-text">
              <h3 data-i18n="session.feature.notifications.title"><?= e(pref_t('session.feature.notifications.title', $current_language)) ?></h3>
              <p data-i18n="session.feature.notifications.desc"><?= e(pref_t('session.feature.notifications.desc', $current_language)) ?></p>
            </div>
          </div>
          <div class="session-feature-item">
            <i class="fas fa-calendar-check session-feature-icon"></i>
            <div class="session-feature-text">
              <h3 data-i18n="session.feature.reservations.title"><?= e(pref_t('session.feature.reservations.title', $current_language)) ?></h3>
              <p data-i18n="session.feature.reservations.desc"><?= e(pref_t('session.feature.reservations.desc', $current_language)) ?></p>
            </div>
          </div>
        </div>
      </div>

      <div class="session-modal-actions">
        <button id="sessionModalLogin" class="btn session-btn-primary">
          <i class="fas fa-sign-in-alt"></i>
          <span data-i18n="session.login"><?= e(pref_t('session.login', $current_language)) ?></span>
        </button>
        <button id="sessionModalGuest" class="btn session-btn-guest">
          <i class="fas fa-user-secret"></i>
          <span data-i18n="session.guest"><?= e(pref_t('session.guest', $current_language)) ?></span>
        </button>
        <p class="account-prompt">
          <span data-i18n="session.no_account"><?= e(pref_t('session.no_account', $current_language)) ?></span>
          <span class="register-link" data-i18n="session.create_account"><?= e(pref_t('session.create_account', $current_language)) ?></span>
        </p>
      </div>
    </div>
  </div>

  <main>
