<?php
require_once __DIR__ . '/includes/security.php';
require_once __DIR__ . '/conexion.php';

safe_session_start();

if (!isset($_SESSION['user_id'])) {
    header('Location: login.php?redirect=' . rawurlencode('mis-reservas.php'));
    exit();
}

$userId = (int) $_SESSION['user_id'];
$page_title = 'Parking SV - Mis reservas';

$stmt = $conex->prepare("
    SELECT r.*, p.name AS parking_name, l.department, l.municipality, vt.category_name,
           pi.image_url
    FROM reservations r
    JOIN parkings p ON p.id = r.parking_id
    JOIN locations l ON l.id = p.location_id
    JOIN vehicle_types vt ON vt.id = r.vehicle_type_id
    LEFT JOIN parking_images pi ON pi.parking_id = p.id AND pi.is_primary = 1
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
");
$stmt->bind_param('i', $userId);
$stmt->execute();
$reservations = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

include 'includes/header.php';
?>

<link rel="stylesheet" href="/crud-php2/assets/css/pages/reservas.css">

<div class="reservations-page">
    <div class="reservations-hero">
        <h1>Mis reservas</h1>
        <p>Aqui puedes revisar tus espacios reservados, su estado y acceder al codigo QR de cada uno.</p>
    </div>

    <section class="inline-ad-slot">
        <div class="inline-ad-slot__content">
            <span class="inline-ad-slot__eyebrow">Espacio para patrocinadores</span>
            <h3>Anunciate aqui</h3>
            <p>Una zona ideal para promociones de restaurantes, talleres, carwash o comercios asociados al viaje.</p>
        </div>
        <a href="about.php" class="inline-ad-slot__cta">Solicitar espacio</a>
    </section>

    <?php if (!empty($reservations)): ?>
        <div class="reservations-grid">
            <?php foreach ($reservations as $reservation): ?>
                <?php
                $statusClass = 'status-' . strtolower($reservation['status']);
                $imageUrl = $reservation['image_url'] ?: 'assets/images/parking deffault.png';
                ?>
                <article class="reservation-card">
                    <img src="<?= e($imageUrl) ?>" alt="<?= e($reservation['parking_name']) ?>" class="reservation-card__image">
                    <div class="reservation-card__content">
                        <div class="reservation-card__top">
                            <h2><?= e($reservation['parking_name']) ?></h2>
                            <span class="reservation-status <?= e($statusClass) ?>"><?= e(ucfirst($reservation['status'])) ?></span>
                        </div>
                        <p class="reservation-card__location"><?= e($reservation['department']) ?>, <?= e($reservation['municipality']) ?></p>
                        <p><strong>Vehiculo:</strong> <?= e($reservation['category_name']) ?></p>
                        <p><strong>Inicio:</strong> <?= e(date('d/m/Y h:i A', strtotime($reservation['fechaHoraInicio']))) ?></p>
                        <p><strong>Fin:</strong> <?= e(date('d/m/Y h:i A', strtotime($reservation['fechaHoraFin']))) ?></p>
                        <div class="reservation-card__actions">
                            <a href="confirmacion-reserva.php?id=<?= (int) $reservation['id'] ?>" class="reservation-btn">Ver QR</a>
                            <a href="detalles-parqueo.php?id=<?= (int) $reservation['parking_id'] ?>" class="reservation-btn secondary">Ver parqueo</a>
                        </div>
                    </div>
                </article>
            <?php endforeach; ?>
        </div>
    <?php else: ?>
        <div class="reservation-empty">
            <i class="fas fa-calendar-times"></i>
            <h2>Aun no tienes reservas</h2>
            <p>Explora parqueos y crea tu primera reserva para completar tu experiencia dentro de Parking SV.</p>
            <a href="parqueos-publicados.php" class="reservation-btn">Buscar parqueos</a>
        </div>
    <?php endif; ?>
</div>

<?php include 'includes/footer.php'; ?>
