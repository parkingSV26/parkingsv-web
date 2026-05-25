<?php
session_start();
require_once(__DIR__ . '/../conexion.php');
header('Content-Type: application/json');

$response = ['success' => false, 'message' => ''];

if (!isset($_SESSION['user_id'])) {
    $response['message'] = 'Usuario no autenticado';
    echo json_encode($response);
    exit;
}

$userId = (int) $_SESSION['user_id'];
$folderName = trim($_POST['name'] ?? '');
$folderColor = $_POST['color'] ?? '#0C6FF9';
$parkings = isset($_POST['parkings']) ? json_decode($_POST['parkings'], true) : [];

if ($folderName === '') {
    $response['message'] = 'Nombre de carpeta vacio';
    echo json_encode($response);
    exit;
}

if (!preg_match('/^#[0-9A-Fa-f]{6}$/', $folderColor)) {
    $folderColor = '#0C6FF9';
}

$parkings = is_array($parkings) ? array_values(array_unique(array_map('intval', $parkings))) : [];

try {
    $conex->begin_transaction();

    $shareToken = bin2hex(random_bytes(6));
    $sqlFolder = "INSERT INTO favorite_folders (user_id, name, color, share_token)
                  VALUES (?, ?, ?, ?)";
    $stmtFolder = $conex->prepare($sqlFolder);
    $stmtFolder->bind_param("isss", $userId, $folderName, $folderColor, $shareToken);
    $stmtFolder->execute();
    $folderId = $conex->insert_id;

    if (!empty($parkings)) {
        $sqlDeleteLoose = "DELETE FROM favorites WHERE user_id = ? AND parking_id = ? AND folder_id IS NULL";
        $stmtDeleteLoose = $conex->prepare($sqlDeleteLoose);

        $sqlExists = "SELECT id FROM favorites WHERE user_id = ? AND parking_id = ? AND folder_id = ? LIMIT 1";
        $stmtExists = $conex->prepare($sqlExists);

        $sqlInsert = "INSERT INTO favorites (user_id, parking_id, folder_id) VALUES (?, ?, ?)";
        $stmtInsert = $conex->prepare($sqlInsert);

        foreach ($parkings as $parkingId) {
            $stmtDeleteLoose->bind_param("ii", $userId, $parkingId);
            $stmtDeleteLoose->execute();

            $stmtExists->bind_param("iii", $userId, $parkingId, $folderId);
            $stmtExists->execute();

            if ($stmtExists->get_result()->num_rows === 0) {
                $stmtInsert->bind_param("iii", $userId, $parkingId, $folderId);
                $stmtInsert->execute();
            }
        }
    }

    $conex->commit();

    $response = [
        'success' => true,
        'folderId' => $folderId,
        'shareToken' => $shareToken,
        'folderName' => $folderName,
        'folderColor' => $folderColor,
        'parkingCount' => count($parkings)
    ];
} catch (Throwable $exception) {
    $conex->rollback();
    $response['message'] = 'Error: ' . $exception->getMessage();
} finally {
    if (isset($stmtFolder)) {
        $stmtFolder->close();
    }
    if (isset($stmtExists)) {
        $stmtExists->close();
    }
    if (isset($stmtDeleteLoose)) {
        $stmtDeleteLoose->close();
    }
    if (isset($stmtInsert)) {
        $stmtInsert->close();
    }
}

echo json_encode($response);
$conex->close();
