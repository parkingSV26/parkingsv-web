<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['parking_id']) && !isset($_POST['action'])) {
    $_POST['action'] = 'add';
}

require __DIR__ . '/includes/guardar-favorito.php';
