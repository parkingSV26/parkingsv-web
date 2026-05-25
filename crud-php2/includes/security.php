<?php

if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(__DIR__));
}

function safe_session_start(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    ini_set('session.use_strict_mode', '1');

    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => '',
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);

    session_start();
}

function send_security_headers(): void
{
    if (headers_sent()) {
        return;
    }

    header('X-Frame-Options: SAMEORIGIN');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Permissions-Policy: camera=(self), geolocation=(self), microphone=()');
}

function csrf_token(): string
{
    safe_session_start();

    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }

    return $_SESSION['csrf_token'];
}

function verify_csrf_token(?string $token): bool
{
    safe_session_start();

    if (empty($_SESSION['csrf_token']) || empty($token)) {
        return false;
    }

    return hash_equals($_SESSION['csrf_token'], $token);
}

function require_csrf_token(?string $token): void
{
    if (!verify_csrf_token($token)) {
        http_response_code(419);
        exit('Solicitud invalida. Recarga la pagina e intentalo de nuevo.');
    }
}

function e(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function json_response(array $payload, int $statusCode = 200): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($payload);
    exit();
}

function validate_uploaded_image(array $file, int $maxBytes = 5242880): array
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        return [false, 'No se pudo procesar la imagen.', null, null];
    }

    if (!is_uploaded_file($file['tmp_name'] ?? '')) {
        return [false, 'Archivo de subida invalido.', null, null];
    }

    if (($file['size'] ?? 0) <= 0 || ($file['size'] ?? 0) > $maxBytes) {
        return [false, 'La imagen supera el tamano permitido.', null, null];
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);

    $allowedTypes = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp',
    ];

    if (!isset($allowedTypes[$mimeType])) {
        return [false, 'Solo se permiten imagenes JPEG, PNG, GIF o WEBP.', null, null];
    }

    $imageInfo = @getimagesize($file['tmp_name']);
    if ($imageInfo === false) {
        return [false, 'La imagen no es valida.', null, null];
    }

    return [true, '', $allowedTypes[$mimeType], $mimeType];
}

function resolve_upload_path(string $relativePath): ?string
{
    $normalized = ltrim(str_replace(['\\', '/'], DIRECTORY_SEPARATOR, $relativePath), DIRECTORY_SEPARATOR);
    $absolutePath = APP_ROOT . DIRECTORY_SEPARATOR . $normalized;
    $realBase = realpath(APP_ROOT . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'uploads');
    $targetDir = realpath(dirname($absolutePath));

    if ($realBase === false || $targetDir === false) {
        return null;
    }

    if (strpos($targetDir, $realBase) !== 0) {
        return null;
    }

    return $absolutePath;
}
