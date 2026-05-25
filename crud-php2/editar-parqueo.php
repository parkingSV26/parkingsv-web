<?php
$id = isset($_GET['id']) ? '?id=' . (int) $_GET['id'] : '';
header('Location: ver-editar-parqueo.php' . $id);
exit();
