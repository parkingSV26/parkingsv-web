<?php
require_once __DIR__ . '/includes/security.php';

safe_session_start();

$allowedIps = ['127.0.0.1', '::1'];
if (!in_array($_SERVER['REMOTE_ADDR'] ?? '', $allowedIps, true)) {
    http_response_code(404);
    exit();
}

header('Content-Type: text/plain; charset=UTF-8');
echo "mail-tester.php deshabilitado para acceso publico.\n";
echo "Usa un flujo autenticado o una herramienta de desarrollo local para probar correo.\n";
