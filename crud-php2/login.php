<?php
require_once __DIR__ . '/includes/security.php';
require_once __DIR__ . '/conexion.php';

safe_session_start();

function resolve_login_redirect(?string $redirect): string
{
    $fallback = 'index.php';
    $redirect = trim((string) $redirect);

    if ($redirect === '' || preg_match('/[\r\n]/', $redirect)) {
        return $fallback;
    }

    if (preg_match('/^https?:\/\//i', $redirect)) {
        return $fallback;
    }

    if (strpos($redirect, '/crud-php2/') === 0) {
        return $redirect;
    }

    return preg_match('/^[A-Za-z0-9._?=&%-]+$/', $redirect) ? $redirect : $fallback;
}

$redirectTarget = resolve_login_redirect($_GET['redirect'] ?? $_POST['redirect'] ?? '');

if (isset($_SESSION['user_id'])) {
    header('Location: ' . $redirectTarget);
    exit();
}

$csrfToken = csrf_token();
$errorMessage = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_csrf_token($_POST['csrf_token'] ?? null);

    $email = trim($_POST['loginEmail'] ?? '');
    $password = trim($_POST['loginPassword'] ?? '');

    $stmt = $conex->prepare('SELECT id, full_name, email, password_hash, user_type, profile_picture FROM users WHERE email = ? LIMIT 1');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if ($row && password_verify($password, $row['password_hash'])) {
        session_regenerate_id(true);
        $_SESSION['user_name'] = $row['full_name'];
        $_SESSION['user_email'] = $row['email'];
        $_SESSION['user_id'] = $row['id'];
        $_SESSION['user_type'] = $row['user_type'];
        $_SESSION['user_profile_picture'] = $row['profile_picture'] ?: '/crud-php2/assets/images/pfp default.jpeg';
        $_SESSION['mensaje'] = '<div class="message success">Bienvenido de nuevo, ' . e($row['full_name']) . '.</div>';

        header('Location: ' . $redirectTarget);
        exit();
    }

    $errorMessage = 'Correo o contrasena incorrectos.';
}

$page_title = 'Parking SV - Iniciar sesion';
include 'includes/header.php';
?>

<link rel="stylesheet" href="/crud-php2/assets/css/pages/login.css">

<div class="login-container">
    <div class="login-card">
        <div class="login-header">
            <img src="img sources/Logo_Parking_SV-bg.png" alt="Parking SV" class="login-logo">
            <h1>Iniciar sesion</h1>
            <p>Accede a tus reservas, favoritos y parqueos publicados desde una pagina dedicada.</p>
        </div>

        <?php if ($errorMessage !== ''): ?>
            <div class="login-alert">
                <i class="fas fa-exclamation-circle"></i>
                <span><?= e($errorMessage) ?></span>
            </div>
        <?php endif; ?>

        <form method="post" class="login-form">
            <input type="hidden" name="csrf_token" value="<?= e($csrfToken) ?>">
            <input type="hidden" name="redirect" value="<?= e($redirectTarget) ?>">

            <label class="login-label" for="loginEmail">Correo electronico</label>
            <div class="login-input">
                <i class="fas fa-envelope"></i>
                <input type="email" id="loginEmail" name="loginEmail" required placeholder="tu@correo.com" value="<?= e($_POST['loginEmail'] ?? '') ?>">
            </div>

            <label class="login-label" for="loginPassword">Contrasena</label>
            <div class="login-input">
                <i class="fas fa-lock"></i>
                <input type="password" id="loginPassword" name="loginPassword" required placeholder="Ingresa tu contrasena">
            </div>

            <button type="submit" class="login-btn">
                <i class="fas fa-sign-in-alt"></i> Entrar
            </button>
        </form>

        <section class="inline-ad-slot login-ad-slot">
            <div class="inline-ad-slot__content">
                <span class="inline-ad-slot__eyebrow">Escalabilidad comercial</span>
                <h3>Anunciate aqui</h3>
                <p>Parking SV puede monetizar esta pantalla con aliados locales y promociones geolocalizadas.</p>
            </div>
            <a href="about.php" class="inline-ad-slot__cta">Conocer planes</a>
        </section>

        <div class="login-footer">
            <p>No tienes cuenta? <a href="register.php">Crear cuenta</a></p>
            <p><a href="index.php">Volver al inicio</a></p>
        </div>
    </div>
</div>

<?php include 'includes/footer.php'; ?>
