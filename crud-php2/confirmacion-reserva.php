<?php
require_once __DIR__ . '/includes/security.php';
require_once __DIR__ . '/conexion.php';

safe_session_start();

if (!isset($_SESSION['user_id'])) {
    header('Location: login.php?redirect=' . rawurlencode('confirmacion-reserva.php?id=' . (int) ($_GET['id'] ?? 0)));
    exit();
}

$reservationId = (int) ($_GET['id'] ?? 0);
$userId = (int) $_SESSION['user_id'];
$page_title = 'Parking SV - Confirmacion de reserva';

$stmt = $conex->prepare("
    SELECT r.*, p.name AS parking_name, l.department, l.municipality, l.street_address,
           vt.category_name, pi.image_url
    FROM reservations r
    JOIN parkings p ON p.id = r.parking_id
    JOIN locations l ON l.id = p.location_id
    JOIN vehicle_types vt ON vt.id = r.vehicle_type_id
    LEFT JOIN parking_images pi ON pi.parking_id = p.id AND pi.is_primary = 1
    WHERE r.id = ? AND r.user_id = ?
    LIMIT 1
");
$stmt->bind_param('ii', $reservationId, $userId);
$stmt->execute();
$reservation = $stmt->get_result()->fetch_assoc();
$stmt->close();

include 'includes/header.php';
?>

<link rel="stylesheet" href="/crud-php2/assets/css/pages/reservas.css">

<div class="reservation-confirmation">
    <?php if (!$reservation): ?>
        <div class="reservation-empty">
            <i class="fas fa-exclamation-triangle"></i>
            <h2>No encontramos esa reserva</h2>
            <p>Verifica el enlace o vuelve a tu listado de reservas.</p>
            <a href="mis-reservas.php" class="reservation-btn">Ir a mis reservas</a>
        </div>
    <?php else: ?>
        <?php $imageUrl = $reservation['image_url'] ?: 'assets/images/parking deffault.png'; ?>
        <div class="confirmation-layout">
            <div class="confirmation-card">
                <img src="<?= e($imageUrl) ?>" alt="<?= e($reservation['parking_name']) ?>" class="confirmation-image">
                <div class="confirmation-details">
                    <span class="confirmation-badge">Reserva confirmada</span>
                    <h1><?= e($reservation['parking_name']) ?></h1>
                    <p><?= e($reservation['department']) ?>, <?= e($reservation['municipality']) ?></p>
                    <p><strong>Direccion:</strong> <?= e($reservation['street_address']) ?></p>
                    <p><strong>Vehiculo:</strong> <?= e($reservation['category_name']) ?></p>
                    <p><strong>Inicio:</strong> <?= e(date('d/m/Y h:i A', strtotime($reservation['fechaHoraInicio']))) ?></p>
                    <p><strong>Fin:</strong> <?= e(date('d/m/Y h:i A', strtotime($reservation['fechaHoraFin']))) ?></p>
                    <p><strong>Codigo QR:</strong> <code><?= e($reservation['codigo_qr']) ?></code></p>
                    <div class="confirmation-actions">
                        <a href="mis-reservas.php" class="reservation-btn secondary">Volver a mis reservas</a>
                        <a href="detalles-parqueo.php?id=<?= (int) $reservation['parking_id'] ?>" class="reservation-btn">Ver parqueo</a>
                    </div>
                </div>
            </div>

            <div class="qr-card">
                <h2>Codigo QR de acceso</h2>
                <p>Muestra este codigo al llegar al parqueo para validar tu reserva.</p>
                <div id="reservation-qrcode" class="reservation-qrcode"></div>
            </div>
        </div>

        <section class="inline-ad-slot">
            <div class="inline-ad-slot__content">
                <span class="inline-ad-slot__eyebrow">Espacio comercial</span>
                <h3>Anunciate aqui</h3>
                <p>Parking SV ya puede monetizar la confirmacion de reserva con aliados relevantes para el viaje.</p>
            </div>
            <a href="about.php" class="inline-ad-slot__cta">Quiero anunciarme</a>
        </section>

        <script>
            document.addEventListener('DOMContentLoaded', function () {
                new QRCode(document.getElementById('reservation-qrcode'), {
                    text: '<?= e($reservation['codigo_qr']) ?>',
                    width: 220,
                    height: 220
                });
            });
        </script>
    <?php endif; ?>
</div>

<?php include 'includes/footer.php'; ?>
