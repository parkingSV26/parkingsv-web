<?php
require_once(__DIR__ . '/includes/security.php');
require_once(__DIR__ . '/conexion.php');
require_once(__DIR__ . '/includes/folder-helpers.php');

safe_session_start();

$folderId = isset($_GET['id']) ? (int) $_GET['id'] : 0;
if ($folderId <= 0) {
    header('Location: guardados.php');
    exit;
}

$folder = obtenerCarpeta($conex, $folderId);
if (!$folder) {
    header('Location: guardados.php');
    exit;
}

$userId = isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : 0;
$isOwner = $userId > 0 && $userId === (int) $folder['user_id'];
$isPublic = (int) $folder['is_public'] === 1;

if (!$isOwner && !$isPublic) {
    header('Location: guardados.php');
    exit;
}

$parkings = obtenerParqueosCarpeta($conex, $folderId);
$feedback = isset($_GET['updated']) ? [
    'type' => 'success',
    'message' => 'Carpeta actualizada con exito.'
] : null;

$page_title = "Parking SV - " . $folder['name'];
include('includes/header.php');
?>

<link rel="stylesheet" href="assets/css/pages/parqueos-publicados.css">
<link rel="stylesheet" href="assets/css/pages/carpeta.css">

<div class="container folder-page">
    <div class="parking-header folder-page-header">
        <div class="universal-back-container">
            <a href="#" class="universal-back-button" id="universalBackButton">
                <img src="img sources/volver-bg.png" alt="Volver atras" class="universal-back-icon">
                <span class="universal-back-text">Volver</span>
            </a>
        </div>

        <div class="parking-info">
            <span class="folder-chip">
                <i class="fas fa-folder"></i>
                <?= $isOwner ? 'Tu carpeta organizada' : 'Carpeta compartida' ?>
            </span>
            <h1><?= e($folder['name']) ?></h1>
            <p class="folder-view-description">
                <?= count($parkings) ?> parqueos guardados
                <?php if ($isOwner): ?>
                    en tu biblioteca de favoritos.
                <?php else: ?>
                    por <?= e($folder['owner_name']) ?>.
                <?php endif; ?>
            </p>
        </div>

        <?php if ($isOwner): ?>
            <div class="action-buttons folder-view-actions">
                <button type="button" class="folder-action-btn share-folder-btn" data-folder-id="<?= $folderId ?>">
                    <i class="fas fa-share-alt"></i> Compartir
                </button>
                <a href="editar-carpeta.php?id=<?= $folderId ?>" class="folder-action-btn secondary">
                    <i class="fas fa-pen"></i> Editar carpeta
                </a>
            </div>
        <?php endif; ?>
    </div>

    <?php if ($feedback): ?>
        <div class="folder-feedback <?= e($feedback['type']) ?>">
            <?= e($feedback['message']) ?>
        </div>
    <?php endif; ?>

    <section class="folder-hero" style="--folder-color: <?= e($folder['color']) ?>;">
        <div class="folder-hero__info">
            <h2>Parqueos dentro de esta carpeta</h2>
            <p>
                Aqui solo ves el contenido organizado. Si quieres meter o sacar parqueos, eso se hace desde la pagina de editar carpeta.
            </p>
        </div>
    </section>

    <div class="folder-section-heading">
        <h2 class="section-title"><?= $isOwner ? 'Parqueos organizados' : 'Parqueos compartidos' ?></h2>
    </div>

    <div class="parkings-grid">
        <?php if (!empty($parkings)): ?>
            <?php foreach ($parkings as $parking): ?>
                <?php
                $rating = $parking['rating'];
                $isNew = empty($rating) || $rating == 0;
                $imageUrl = $parking['image_url'] ?: 'assets/images/parking deffault.png';
                ?>
                <div class="parking-card-container">
                    <div class="parking-card" data-parking-id="<?= (int) $parking['id'] ?>">
                        <div class="save-icon active">
                            <i class="fas fa-bookmark"></i>
                        </div>
                        <a href="detalles-parqueo.php?id=<?= (int) $parking['id'] ?>&fromCarpeta=<?= $folderId ?>" class="parking-card-link">
                            <div class="card-image">
                                <img src="<?= e($imageUrl) ?>" alt="<?= e($parking['name']) ?>">
                            </div>
                            <div class="card-content">
                                <h3><?= e($parking['name']) ?></h3>
                                <div class="location"><?= e($parking['department']) ?>, <?= e($parking['municipality']) ?></div>
                                <div class="schedule-rating">
                                    <div class="schedule"><?= e($parking['horario']) ?></div>
                                    <?php if ($isNew): ?>
                                        <div class="new-badge">Nuevo</div>
                                    <?php else: ?>
                                        <div class="rating"><?= number_format((float) $rating, 1) ?> &#9733;</div>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </a>
                    </div>
                </div>
            <?php endforeach; ?>
        <?php else: ?>
            <div class="folder-empty-state">
                <img src="img sources/no-carpets.png" alt="Carpeta vacia">
                <h3>Esta carpeta esta vacia</h3>
                <?php if ($isOwner): ?>
                    <p>Cuando quieras agregar parqueos, el boton de abajo te lleva directo a editar carpeta.</p>
                    <a href="editar-carpeta.php?id=<?= $folderId ?>" class="folder-empty-cta">
                        <i class="fas fa-plus"></i> Anadir parqueos
                    </a>
                <?php else: ?>
                    <p>Esta carpeta compartida todavia no tiene parqueos agregados.</p>
                <?php endif; ?>
            </div>
        <?php endif; ?>
    </div>
</div>

<?php
$conex->close();
include('includes/footer.php');
?>

<script src="assets/js/pages/carpeta.js"></script>
