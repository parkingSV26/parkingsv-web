<?php
session_start();
require_once(__DIR__ . '/../conexion.php');
header('Content-Type: application/json');

$response = ['success' => false, 'message' => 'Solicitud invalida'];

if (!isset($_SESSION['user_id'])) {
    $response['message'] = 'Debes iniciar sesion para compartir carpetas';
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
    $selectStmt = $conex->prepare("SELECT id, share_token FROM favorite_folders WHERE id = ? AND user_id = ? LIMIT 1");
    $selectStmt->bind_param("ii", $folderId, $userId);
    $selectStmt->execute();
    $folder = $selectStmt->get_result()->fetch_assoc();

    if (!$folder) {
        throw new RuntimeException('No encontramos esa carpeta');
    }

    $shareToken = !empty($folder['share_token']) ? $folder['share_token'] : bin2hex(random_bytes(6));
    $updateStmt = $conex->prepare("UPDATE favorite_folders SET is_public = 1, share_token = ? WHERE id = ? AND user_id = ?");
    $updateStmt->bind_param("sii", $shareToken, $folderId, $userId);
    $updateStmt->execute();

    $response = [
        'success' => true,
        'shareToken' => $shareToken,
        'shareUrl' => '/crud-php2/carpeta-public.php?token=' . urlencode($shareToken)
    ];
} catch (Throwable $exception) {
    $response['message'] = $exception->getMessage();
} finally {
    if (isset($selectStmt)) {
        $selectStmt->close();
    }
    if (isset($updateStmt)) {
        $updateStmt->close();
    }
    $conex->close();
}

echo json_encode($response);
