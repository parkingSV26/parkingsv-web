<?php
require_once __DIR__ . '/includes/security.php';
require_once __DIR__ . '/conexion.php';

safe_session_start();

$allowedIps = ['127.0.0.1', '::1'];
if (!in_array($_SERVER['REMOTE_ADDR'] ?? '', $allowedIps, true)) {
    http_response_code(404);
    exit();
}

header('Content-Type: text/plain; charset=UTF-8');

echo "Diagnostico de base de datos\n";
echo "===========================\n";
echo $conex ? "Conexion: OK\n" : "Conexion: ERROR\n";

$result = mysqli_query($conex, "SHOW TABLES LIKE 'users'");
echo mysqli_num_rows($result) > 0 ? "Tabla users: OK\n" : "Tabla users: NO ENCONTRADA\n";
