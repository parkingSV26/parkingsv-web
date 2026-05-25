<?php
require_once __DIR__ . '/security.php';
require_once __DIR__ . '/../conexion.php';

safe_session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_SESSION['user_id'])) {
    header('Location: /crud-php2/index.php');
    exit();
}

require_csrf_token($_POST['csrf_token'] ?? null);

$parking_id = isset($_POST['parking_id']) ? (int) $_POST['parking_id'] : 0;
if ($parking_id <= 0) {
    $_SESSION['error_message'] = 'Solicitud invalida.';
    header('Location: /crud-php2/mis-parqueos.php');
    exit();
}

$stmt = $conex->prepare('SELECT owner_id, location_id FROM parkings WHERE id = ?');
$stmt->bind_param('i', $parking_id);
$stmt->execute();
$parking = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$parking || (int) $parking['owner_id'] !== (int) $_SESSION['user_id']) {
    $_SESSION['error_message'] = 'No tienes permiso para eliminar este parqueo.';
    header('Location: /crud-php2/mis-parqueos.php');
    exit();
}

$conex->begin_transaction();

try {
    $images_stmt = $conex->prepare('SELECT image_url FROM parking_images WHERE parking_id = ?');
    $images_stmt->bind_param('i', $parking_id);
    $images_stmt->execute();
    $images = $images_stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $images_stmt->close();

    foreach ($images as $image) {
        $relativePath = $image['image_url'] ?? '';
        $absolutePath = resolve_upload_path($relativePath);

        if ($absolutePath && file_exists($absolutePath)) {
            @unlink($absolutePath);
        }
    }

    $tables = [
        'favorites' => 'parking_id',
        'parking_news' => 'parking_id',
        'parking_updates' => 'parking_id',
        'reviews' => 'parking_id',
        'parking_fees' => 'parking_id',
        'parking_images' => 'parking_id',
        'parking_vehicle_capacities' => 'parking_id',
        'parking_restriction_items' => 'parking_id',
        'parking_services' => 'parking_id',
        'parking_restrictions' => 'parking_id',
        'parking_capacities' => 'parking_id',
        'parkings' => 'id',
        'locations' => 'id',
    ];

    $location_id = (int) $parking['location_id'];

    foreach ($tables as $table => $column) {
        $value = $table === 'locations' ? $location_id : $parking_id;
        $deleteStmt = $conex->prepare("DELETE FROM $table WHERE $column = ?");
        $deleteStmt->bind_param('i', $value);
        $deleteStmt->execute();
        $deleteStmt->close();
    }

    $conex->commit();
    $_SESSION['success_message'] = 'Parqueo eliminado exitosamente.';
} catch (Throwable $e) {
    $conex->rollback();
    error_log('Error al eliminar parqueo: ' . $e->getMessage());
    $_SESSION['error_message'] = 'No se pudo eliminar el parqueo.';
}

header('Location: /crud-php2/mis-parqueos.php');
exit();
