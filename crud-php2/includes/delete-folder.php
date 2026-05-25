<?php
session_start();
require_once(__DIR__ . '/../conexion.php');
header('Content-Type: application/json');

$response = ['success' => false, 'message' => 'Solicitud invalida'];

if (!isset($_SESSION['user_id'])) {
    $response['message'] = 'Debes iniciar sesion para eliminar carpetas';
    echo json_encode($response);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode($response);
    exit;
}

$userId = (int) $_SESSION['user_id'];
$folderId = isset($_POST['folder_id']) ? (int) $_POST['folder_id'] : 0;

if ($folderId <= 0) {
    $response['message'] = 'Carpeta no valida';
    echo json_encode($response);
    exit;
}

try {
    $conex->begin_transaction();

    $existsStmt = $conex->prepare("SELECT id FROM favorite_folders WHERE id = ? AND user_id = ? LIMIT 1");
    $existsStmt->bind_param("ii", $folderId, $userId);
    $existsStmt->execute();

    if (!$existsStmt->get_result()->fetch_assoc()) {
        throw new RuntimeException('La carpeta ya no existe o no te pertenece');
    }

    $folderFavoritesStmt = $conex->prepare("SELECT parking_id FROM favorites WHERE user_id = ? AND folder_id = ?");
    $folderFavoritesStmt->bind_param("ii", $userId, $folderId);
    $folderFavoritesStmt->execute();
    $folderFavoritesResult = $folderFavoritesStmt->get_result();

    $countOtherStmt = $conex->prepare("SELECT COUNT(*) AS total FROM favorites WHERE user_id = ? AND parking_id = ? AND (folder_id IS NULL OR folder_id <> ?)");
    $insertLooseStmt = $conex->prepare("INSERT INTO favorites (user_id, parking_id, folder_id) VALUES (?, ?, NULL)");

    while ($favoriteRow = $folderFavoritesResult->fetch_assoc()) {
        $parkingId = (int) $favoriteRow['parking_id'];

        $countOtherStmt->bind_param("iii", $userId, $parkingId, $folderId);
        $countOtherStmt->execute();
        $otherFavorites = $countOtherStmt->get_result()->fetch_assoc();

        if ((int) ($otherFavorites['total'] ?? 0) === 0) {
            $insertLooseStmt->bind_param("ii", $userId, $parkingId);
            $insertLooseStmt->execute();
        }
    }

    $deleteFavoritesStmt = $conex->prepare("DELETE FROM favorites WHERE user_id = ? AND folder_id = ?");
    $deleteFavoritesStmt->bind_param("ii", $userId, $folderId);
    $deleteFavoritesStmt->execute();

    $deleteStmt = $conex->prepare("DELETE FROM favorite_folders WHERE id = ? AND user_id = ?");
    $deleteStmt->bind_param("ii", $folderId, $userId);
    $deleteStmt->execute();

    if ($deleteStmt->affected_rows < 1) {
        throw new RuntimeException('No se pudo eliminar la carpeta');
    }

    $conex->commit();
    $response = ['success' => true];
} catch (Throwable $exception) {
    $conex->rollback();
    $response['message'] = $exception->getMessage();
} finally {
    if (isset($existsStmt)) {
        $existsStmt->close();
    }
    if (isset($folderFavoritesStmt)) {
        $folderFavoritesStmt->close();
    }
    if (isset($countOtherStmt)) {
        $countOtherStmt->close();
    }
    if (isset($insertLooseStmt)) {
        $insertLooseStmt->close();
    }
    if (isset($deleteFavoritesStmt)) {
        $deleteFavoritesStmt->close();
    }
    if (isset($deleteStmt)) {
        $deleteStmt->close();
    }
    $conex->close();
}

echo json_encode($response);
