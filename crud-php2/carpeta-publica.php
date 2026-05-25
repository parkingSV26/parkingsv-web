<?php
$token = isset($_GET['token']) ? '?token=' . urlencode($_GET['token']) : '';
header('Location: carpeta-public.php' . $token);
exit();
