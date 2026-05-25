<?php
require_once(__DIR__ . '/includes/security.php');
require_once(__DIR__ . '/conexion.php');
require_once(__DIR__ . '/includes/folder-helpers.php');

safe_session_start();

if (!isset($_SESSION['user_id'])) {
    header('Location: index.php');
    exit;
}

$folderId = isset($_GET['id']) ? (int) $_GET['id'] : 0;
if ($folderId <= 0) {
    header('Location: guardados.php');
    exit;
}

$folder = obtenerCarpeta($conex, $folderId);
$userId = (int) $_SESSION['user_id'];

if (!$folder || $userId !== (int) $folder['user_id']) {
    header('Location: guardados.php');
    exit;
}

$feedback = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $folderName = trim($_POST['name'] ?? '');
    $folderColor = $_POST['color'] ?? '#0C6FF9';
    $selectedParkings = isset($_POST['parkings']) ? $_POST['parkings'] : [];
    $selectedParkings = is_array($selectedParkings) ? array_values(array_unique(array_map('intval', $selectedParkings))) : [];

    if ($folderName === '') {
        $feedback = [
            'type' => 'error',
            'message' => 'Ingresa un nombre para la carpeta.'
        ];
    } else {
        if (!preg_match('/^#[0-9A-Fa-f]{6}$/', $folderColor)) {
            $folderColor = '#0C6FF9';
        }

        try {
            $conex->begin_transaction();

            $updateFolderStmt = $conex->prepare("UPDATE favorite_folders SET name = ?, color = ? WHERE id = ? AND user_id = ?");
            $updateFolderStmt->bind_param("ssii", $folderName, $folderColor, $folderId, $userId);
            $updateFolderStmt->execute();

            $currentStmt = $conex->prepare("SELECT parking_id FROM favorites WHERE user_id = ? AND folder_id = ?");
            $currentStmt->bind_param("ii", $userId, $folderId);
            $currentStmt->execute();
            $currentResult = $currentStmt->get_result();

            $currentParkingIds = [];
            while ($row = $currentResult->fetch_assoc()) {
                $currentParkingIds[] = (int) $row['parking_id'];
            }

            $toAdd = array_values(array_diff($selectedParkings, $currentParkingIds));
            $toRemove = array_values(array_diff($currentParkingIds, $selectedParkings));

            if (!empty($toAdd)) {
                $deleteLooseStmt = $conex->prepare("DELETE FROM favorites WHERE user_id = ? AND parking_id = ? AND folder_id IS NULL");
                $insertFavoriteStmt = $conex->prepare("INSERT INTO favorites (user_id, parking_id, folder_id) VALUES (?, ?, ?)");
                foreach ($toAdd as $parkingId) {
                    $deleteLooseStmt->bind_param("ii", $userId, $parkingId);
                    $deleteLooseStmt->execute();

                    $insertFavoriteStmt->bind_param("iii", $userId, $parkingId, $folderId);
                    $insertFavoriteStmt->execute();
                }
            }

            if (!empty($toRemove)) {
                $countOtherFoldersStmt = $conex->prepare("SELECT COUNT(*) AS total FROM favorites WHERE user_id = ? AND parking_id = ? AND (folder_id IS NULL OR folder_id <> ?)");
                $deleteFavoriteStmt = $conex->prepare("DELETE FROM favorites WHERE user_id = ? AND parking_id = ? AND folder_id = ?");
                $insertLooseStmt = $conex->prepare("INSERT INTO favorites (user_id, parking_id, folder_id) VALUES (?, ?, NULL)");

                foreach ($toRemove as $parkingId) {
                    $deleteFavoriteStmt->bind_param("iii", $userId, $parkingId, $folderId);
                    $deleteFavoriteStmt->execute();

                    $countOtherFoldersStmt->bind_param("iii", $userId, $parkingId, $folderId);
                    $countOtherFoldersStmt->execute();
                    $otherFolders = $countOtherFoldersStmt->get_result()->fetch_assoc();

                    if ((int) ($otherFolders['total'] ?? 0) === 0) {
                        $insertLooseStmt->bind_param("ii", $userId, $parkingId);
                        $insertLooseStmt->execute();
                    }
                }
            }

            $conex->commit();
            header('Location: carpeta.php?id=' . $folderId . '&updated=1');
            exit;
        } catch (Throwable $exception) {
            $conex->rollback();
            $feedback = [
                'type' => 'error',
                'message' => 'No se pudieron guardar los cambios. ' . $exception->getMessage()
            ];
        } finally {
            if (isset($updateFolderStmt)) {
                $updateFolderStmt->close();
            }
            if (isset($currentStmt)) {
                $currentStmt->close();
            }
            if (isset($insertFavoriteStmt)) {
                $insertFavoriteStmt->close();
            }
            if (isset($deleteLooseStmt)) {
                $deleteLooseStmt->close();
            }
            if (isset($deleteFavoriteStmt)) {
                $deleteFavoriteStmt->close();
            }
            if (isset($countOtherFoldersStmt)) {
                $countOtherFoldersStmt->close();
            }
            if (isset($insertLooseStmt)) {
                $insertLooseStmt->close();
            }
        }
    }
}

$favoriteOptions = obtenerFavoritosUsuario($conex, $userId, $folderId);
$selectedCount = 0;
foreach ($favoriteOptions as $favoriteOption) {
    if ((int) $favoriteOption['in_current_folder'] === 1) {
        $selectedCount++;
    }
}

$page_title = "Parking SV - Editar " . $folder['name'];
include('includes/header.php');
?>

<link rel="stylesheet" href="assets/css/pages/parqueos-publicados.css">
<link rel="stylesheet" href="assets/css/pages/carpeta.css">

<div class="container folder-page">
    <div class="parking-header folder-page-header">
        <div class="universal-back-container">
            <a href="carpeta.php?id=<?= $folderId ?>" class="universal-back-button">
                <img src="img sources/volver-bg.png" alt="Volver atras" class="universal-back-icon">
                <span class="universal-back-text">Volver</span>
            </a>
        </div>

        <div class="parking-info">
            <span class="folder-chip">
                <i class="fas fa-pen"></i>
                Editar carpeta
            </span>
            <h1 class="folder-editor-title"><?= e($folder['name']) ?></h1>
            <p class="folder-editor-description">
                Cambia el nombre, el color y decide que favoritos quieres tener dentro de esta carpeta.
            </p>
        </div>

        <div class="action-buttons folder-edit-top-actions">
            <button type="submit" form="folder-editor-form" class="folder-action-btn">
                <i class="fas fa-save"></i> Guardar cambios
            </button>
            <button type="button" class="folder-action-btn danger btn-delete-folder" data-folder-id="<?= $folderId ?>" data-folder-name="<?= e($folder['name']) ?>">
                <i class="fas fa-trash"></i> Eliminar carpeta
            </button>
        </div>
    </div>

    <?php if ($feedback): ?>
        <div class="folder-feedback <?= e($feedback['type']) ?>">
            <?= e($feedback['message']) ?>
        </div>
    <?php endif; ?>

    <section class="folder-editor-card">
        <form method="post" id="folder-editor-form">
            <div class="folder-editor-grid">
                <div class="folder-form-column">
                    <label for="folder-name">Nombre de la carpeta</label>
                    <input type="text" id="folder-name" name="name" maxlength="50" value="<?= e($folder['name']) ?>" required>

                    <label>Color</label>
                    <input type="hidden" id="folder-color-input" name="color" value="<?= e($folder['color']) ?>">
                    <div class="folder-color-options">
                        <?php
                        $folderColors = ['#0C6FF9', '#4CAF50', '#FF5722', '#9C27B0', '#FFC107', '#E91E63', '#009688'];
                        foreach ($folderColors as $color):
                        ?>
                            <button
                                type="button"
                                class="folder-color-option <?= strtolower($folder['color']) === strtolower($color) ? 'active' : '' ?>"
                                data-color="<?= e($color) ?>"
                                style="background-color: <?= e($color) ?>;"
                                aria-label="Seleccionar color <?= e($color) ?>">
                            </button>
                        <?php endforeach; ?>
                    </div>

                    <div class="folder-color-preview">
                        <span class="folder-color-swatch" id="folder-color-preview" style="background-color: <?= e($folder['color']) ?>;"></span>
                        <span id="folder-color-value"><?= e($folder['color']) ?></span>
                    </div>

                    <p class="folder-helper-text folder-delete-note">
                        Si eliminas esta carpeta, sus parqueos solo quedaran sin carpeta cuando ya no esten guardados en otra.
                    </p>
                </div>

                <div class="folder-form-column">
                    <div class="folder-editor-toolbar">
                        <div>
                            <label for="folder-search">Buscar entre tus favoritos</label>
                            <div class="folder-search-bar">
                                <i class="fas fa-search"></i>
                                <input type="text" id="folder-search" placeholder="Busca por nombre, departamento o municipio">
                            </div>
                        </div>
                        <div class="folder-selection-summary">
                            <strong id="folder-selected-count"><?= $selectedCount ?></strong> parqueos seleccionados
                        </div>
                    </div>

                    <?php if (!empty($favoriteOptions)): ?>
                        <div class="folder-parking-options" id="folder-parking-options">
                            <?php foreach ($favoriteOptions as $favorite): ?>
                                <?php
                                $isSelected = (int) $favorite['in_current_folder'] === 1;
                                $otherFolderNames = array_filter(explode('||', (string) ($favorite['other_folder_names'] ?? '')));
                                $searchText = strtolower(trim($favorite['name'] . ' ' . $favorite['department'] . ' ' . $favorite['municipality'] . ' ' . implode(' ', $otherFolderNames)));
                                ?>
                                <label class="folder-parking-option <?= $isSelected ? 'selected' : '' ?>" data-search="<?= e($searchText) ?>">
                                    <input type="checkbox" name="parkings[]" value="<?= (int) $favorite['id'] ?>" <?= $isSelected ? 'checked' : '' ?>>
                                    <div class="folder-parking-option__body">
                                        <strong><?= e($favorite['name']) ?></strong>
                                        <span><?= e($favorite['department']) ?>, <?= e($favorite['municipality']) ?></span>

                                        <?php if ($isSelected): ?>
                                            <span class="folder-assignment current">Ya esta en esta carpeta</span>
                                        <?php elseif (!empty($otherFolderNames)): ?>
                                            <span class="folder-assignment other">Tambien esta en: <?= e(implode(', ', $otherFolderNames)) ?></span>
                                        <?php elseif ((int) $favorite['has_loose_favorite'] === 1): ?>
                                            <span class="folder-assignment none">Favorito sin carpeta</span>
                                        <?php else: ?>
                                            <span class="folder-assignment none">Se agregara al guardar</span>
                                        <?php endif; ?>
                                    </div>
                                </label>
                            <?php endforeach; ?>
                        </div>
                        <p class="folder-empty-results" id="folder-search-empty" hidden>No hay favoritos que coincidan con esa busqueda.</p>
                    <?php else: ?>
                        <div class="folder-empty-state folder-empty-state--editor">
                            <img src="img sources/no-guardados-o-parqueos.png" alt="Sin favoritos">
                            <h3>Aun no tienes favoritos para organizar</h3>
                            <p>Primero guarda parqueos desde la pagina de publicados y luego podras meterlos en esta carpeta.</p>
                            <a href="parqueos-publicados.php" class="folder-empty-cta">
                                <i class="fas fa-search"></i> Ir a parqueos publicados
                            </a>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </form>
    </section>
</div>

<?php
$conex->close();
include('includes/footer.php');
?>

<script src="assets/js/pages/carpeta.js"></script>
