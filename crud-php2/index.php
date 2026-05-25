<?php
require_once __DIR__ . '/includes/security.php';
require_once __DIR__ . '/conexion.php';

safe_session_start();
mysqli_report(MYSQLI_REPORT_OFF);
$csrfToken = csrf_token();

if (isset($_POST['logout'])) {
    require_csrf_token($_POST['csrf_token'] ?? null);

    $_SESSION = [];
    session_regenerate_id(true);
    $_SESSION['mensaje'] = '<div class="message success">Has cerrado sesion.</div>';
    header('Location: index.php');
    exit();
}

if (isset($_SESSION['user_name']) && isset($_POST['register'])) {
    require_csrf_token($_POST['csrf_token'] ?? null);
    $_SESSION['mensaje'] = '<div class="message error">Ya tienes una sesion iniciada. Cierra sesion antes de crear otra cuenta.</div>';
    header('Location: index.php');
    exit();
}

if (isset($_POST['register'])) {
    require_csrf_token($_POST['csrf_token'] ?? null);

    $name = trim($_POST['name'] ?? '');
    $lastName = trim($_POST['lastName'] ?? '');
    $fullName = trim($name . ' ' . $lastName);
    $email = trim($_POST['email'] ?? '');
    $password = trim($_POST['password'] ?? '');
    $phoneNumber = trim($_POST['phone'] ?? '');
    $userType = $_POST['userType'] ?? '';
    $dateOfBirth = !empty($_POST['birth_date']) ? $_POST['birth_date'] : null;
    $businessName = !empty($_POST['business_name']) ? trim($_POST['business_name']) : null;
    $createdAt = date('Y-m-d H:i:s');
    $locationPermission = 0;

    if ($userType === 'customer') {
        $businessName = null;
    } elseif ($userType === 'owner') {
        $dateOfBirth = null;
    }

    $validBirthDate = $dateOfBirth === null || preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateOfBirth);
    if ($fullName === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 8 || $phoneNumber === '' || !in_array($userType, ['customer', 'owner'], true) || !$validBirthDate) {
        $_SESSION['mensaje'] = '<div class="message error">Completa correctamente los campos. La contrasena debe tener al menos 8 caracteres.</div>';
        header('Location: index.php');
        exit();
    }

    $checkStmt = $conex->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $checkStmt->bind_param('s', $email);
    $checkStmt->execute();
    $existingUser = $checkStmt->get_result()->fetch_assoc();
    $checkStmt->close();

    if ($existingUser) {
        $_SESSION['mensaje'] = '<div class="message error">El correo ya esta registrado. Intenta con otro.</div>';
        header('Location: index.php');
        exit();
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $conex->prepare('INSERT INTO users (full_name, email, password_hash, phone_number, date_of_birth, business_name, user_type, created_at, location_permission) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->bind_param('ssssssssi', $fullName, $email, $passwordHash, $phoneNumber, $dateOfBirth, $businessName, $userType, $createdAt, $locationPermission);
    $saved = $stmt->execute();
    $userId = $stmt->insert_id;
    $stmt->close();

    if ($saved) {
        session_regenerate_id(true);
        $_SESSION['user_name'] = $fullName;
        $_SESSION['user_email'] = $email;
        $_SESSION['user_type'] = $userType;
        $_SESSION['user_id'] = $userId;
        $_SESSION['user_profile_picture'] = '/crud-php2/assets/images/pfp default.jpeg';
        $_SESSION['mensaje'] = '<div class="message success">Bienvenido, ' . e($fullName) . '.</div>';
    } else {
        error_log('Error al crear usuario en index.php: ' . mysqli_error($conex));
        $_SESSION['mensaje'] = '<div class="message error">No se pudo crear la cuenta en este momento.</div>';
    }

    header('Location: index.php');
    exit();
}

if (isset($_POST['login'])) {
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
    } else {
        $_SESSION['mensaje'] = '<div class="message error">Correo o contrasena incorrectos.</div>';
    }

    header('Location: index.php');
    exit();
}

$page_title = 'Parking SV - Inicio';
include 'includes/header.php';
?>

<?php if (basename($_SERVER['PHP_SELF']) === 'index.php'): ?>
  <link rel="stylesheet" href="/crud-php2/assets/css/pages/index.css">
<?php endif; ?>

<section class="problem-wrapper snap-section" id="problematica">
    <h1 class="problem-title">
        <span class="highlight">Todos</span> nos enfrentamos a esta problematica.<br>
        En El Salvador y en el mundo.
    </h1>
    <div class="problem-content">
        <div class="problem-left">
            <p class="problem-desc">
                Cada dia, miles de nosotros perdemos tiempo, dinero y energia buscando parqueo.
                El trafico y la falta de informacion dificultan estacionarse con eficiencia.
            </p>
            <p class="problem-desc">
                Parking SV nace como una solucion rapida y confiable para encontrar espacios disponibles, sin estres ni perdidas de tiempo.
            </p>
        </div>
        <div class="problem-right">
            <div class="floating-images">
                <img src="img sources/bubble1.png" alt="Solucion Parking SV">
            </div>
        </div>
    </div>
    <div class="buttons">
        <?php if (!isset($_SESSION['user_id'])): ?>
            <a href="login.php" class="btn-action">Empezar ya</a>
            <a href="register.php" class="btn-action">Publicar mi espacio ya</a>
        <?php else: ?>
            <?php if (isset($_SESSION['user_type']) && $_SESSION['user_type'] === 'customer'): ?>
                <a href="parqueos-publicados.php" class="btn-action">Empezar ya</a>
            <?php elseif (isset($_SESSION['user_type']) && $_SESSION['user_type'] === 'owner'): ?>
                <a href="publicar-parqueo.php" class="btn-action">Publicar mi espacio ya</a>
            <?php else: ?>
                <a href="parqueos-publicados.php" class="btn-action"><strong>Empezar ya</strong></a>
            <?php endif; ?>
        <?php endif; ?>
    </div>
</section>

<section class="inline-ad-slot">
  <div class="inline-ad-slot__content">
    <span class="inline-ad-slot__eyebrow">Monetizacion MVP</span>
    <h3>Anunciate aqui</h3>
    <p>Ideal para carwash, talleres, restaurantes cercanos, turismo local y servicios pensados para conductores.</p>
  </div>
  <a href="about.php" class="inline-ad-slot__cta">Reservar espacio</a>
</section>

<section class="carousel-slide snap-section" id="solucion1">
    <h2>Parking SV tiene la solucion</h2>
    <div class="carousel-slide-content">
        <div class="carousel-slide-text">
            <p>Parking SV es la solucion inteligente, rapida y local para conectar personas que necesitan parqueo con quienes tienen un espacio disponible.</p>
            <p class="feature-item">Sin complicaciones, sin perder tiempo, sin estres.</p>
            <p class="feature-item">Publica tu lote o empieza a ganar</p>
            <p class="feature-item">Encontra un parqueo cerca, confiable y en minutos.</p>
        </div>
        <div class="carousel-slide-img">
            <img src="img sources/solution.png" alt="solucion img">
        </div>
    </div>
</section>

<section class="carousel-slide snap-section" id="solucion2">
    <h2>Como funciona?</h2>
    <div class="carousel-slide-content">
        <div class="carousel-slide-text">
            <p class="feature-item">Explora la lista de parqueos en tiempo real</p>
            <p class="feature-item">Encuentra parqueos cerca de tu destino</p>
            <p class="feature-item">Verifica la informacion del espacio y la calificacion del parqueo</p>
            <p class="feature-item">Selecciona un parqueo, mira el mapa, maneja en Waze y listo</p>
        </div>
        <div class="carousel-slide-img">
            <img src="img sources/sample.png" alt="video">
        </div>
    </div>
</section>

<section class="carousel-slide snap-section" id="solucion3">
    <h2>Por que Parking SV?</h2>
    <div class="carousel-slide-content">
        <div class="carousel-slide-text">
            <p class="feature-item">Hecha por salvadorenos, para salvadorenos</p>
            <p class="feature-item">Sin comisiones, sin apps complicadas</p>
            <p class="feature-item">Comunidad verificada</p>
            <p class="feature-item">Ahorro de tiempo, combustible y dinero</p>
        </div>
        <div class="carousel-slide-img">
            <img src="img sources/nosotros.png" alt="por que Parking SV">
        </div>
    </div>
</section>

<div class="message-modal" id="messageModal" style="display: none;">
  <div class="message-modal-content">
    <span class="close-message-modal">&times;</span>
    <div id="messageContent">
      <?php if (isset($_SESSION['mensaje'])): ?>
        <?php echo $_SESSION['mensaje']; ?>
        <?php unset($_SESSION['mensaje']); ?>
      <?php endif; ?>
    </div>
  </div>
</div>

<div class="login-signup-modal" id="loginSignupModal">
  <div class="modal-content">
    <span class="close-modal" id="closeModalBtn">&times;</span>
    <div class="auth-tabs">
      <button id="switchLogin" class="auth-tab active">Iniciar sesion</button>
      <button id="switchSignup" class="auth-tab">Registrarse</button>
    </div>
    <div class="logo-container">
      <img src="img sources/Logo_Parking_SV-bg.png" alt="Logo Parking SV" class="auth-logo">
    </div>
    <form id="loginForm" method="post" action="">
      <input type="hidden" name="csrf_token" value="<?php echo e($csrfToken); ?>">
      <div class="form-group">
        <i class="fas fa-envelope"></i>
        <input type="email" name="loginEmail" placeholder="Correo electronico" required>
      </div>
      <div class="form-group">
        <i class="fas fa-lock"></i>
        <input type="password" name="loginPassword" placeholder="Contrasena" required>
      </div>
      <button type="submit" name="login" class="btn-auth btn-login">Iniciar sesion</button>
    </form>
    <form id="signupForm" method="post" action="">
      <input type="hidden" name="csrf_token" value="<?php echo e($csrfToken); ?>">
      <div class="form-group">
        <i class="fas fa-user"></i>
        <input type="text" name="name" placeholder="Nombre" required>
      </div>
      <div class="form-group">
        <i class="fas fa-user"></i>
        <input type="text" name="lastName" placeholder="Apellidos" required>
      </div>
      <div class="form-group">
        <i class="fas fa-envelope"></i>
        <input type="email" name="email" placeholder="Correo electronico" required>
      </div>
      <div class="form-group">
        <i class="fas fa-lock"></i>
        <input type="password" name="password" placeholder="Contrasena" minlength="8" required>
      </div>
      <div class="form-group">
        <label for="userTypeSelect">Eres cliente o propietario?</label>
        <select name="userType" id="userTypeSelect" required>
          <option value="">Selecciona una opcion</option>
          <option value="customer">Cliente</option>
          <option value="owner">Propietario</option>
        </select>
      </div>
      <div class="form-group">
        <i class="fas fa-phone"></i>
        <input type="text" name="phone" placeholder="Telefono" required autocomplete="tel">
      </div>
      <div class="form-group" id="birthDateGroup" style="display:none;">
        <i class="fas fa-calendar-alt"></i>
        <p>Fecha de nacimiento</p>
        <input type="date" name="birth_date" id="birthDateInput">
      </div>
      <div class="form-group" id="businessNameGroup" style="display:none;">
        <i class="fas fa-store"></i>
        <input type="text" name="business_name" placeholder="Nombre del negocio" id="businessNameInput">
      </div>
      <button type="submit" name="register" class="btn-auth btn-signup">Registrarse</button>
    </form>
  </div>
</div>

<div class="ad-card snap-section" id="anuncios">
  <h3 class="ad-title">Anunciate Aqui</h3>
  <p class="ad-subtitle">Ejemplos de anunciantes potenciales:</p>
  <ul class="ad-examples">
    <li>Lugares turisticos</li>
    <li>Carwash para autos</li>
    <li>Talleres mecanicos</li>
    <li>Tiendas de accesorios vehiculares</li>
    <li>Restaurantes cercanos</li>
    <li>Servicios de taxi</li>
  </ul>
</div>

<?php include 'includes/footer.php'; ?>
