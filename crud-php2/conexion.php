<?php
$host = "localhost";
$user = "root";
$pass = "";
$db = "parking_sv_db";

$conex = mysqli_connect($host, $user, $pass, $db);

if (!$conex) {
    error_log('Error de conexion MySQL: ' . mysqli_connect_error());
    http_response_code(500);
    exit('No se pudo conectar a la base de datos.');
}

mysqli_set_charset($conex, 'utf8mb4');
