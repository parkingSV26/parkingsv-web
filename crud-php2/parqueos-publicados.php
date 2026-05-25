<?php
$body_class = 'page-parqueos-publicados';
session_start();
include 'conexion.php';

$page_title = 'Parking SV - Parqueos Publicados';
$isLoggedIn = isset($_SESSION['user_id']);
$userId = $isLoggedIn ? (int) $_SESSION['user_id'] : 0;

$userVehicles = [];
if ($isLoggedIn) {
    $vehicleSql = "SELECT vt.id, vt.category_name
                   FROM user_vehicles uv
                   JOIN vehicle_types vt ON vt.id = uv.vehicle_type_id
                   WHERE uv.user_id = $userId";
    $vehicleResult = $conex->query($vehicleSql);
    while ($row = $vehicleResult->fetch_assoc()) {
        $userVehicles[] = $row;
    }
}

$departments = [];
$deptSql = "SELECT DISTINCT department FROM locations ORDER BY department";
$deptResult = $conex->query($deptSql);
while ($row = $deptResult->fetch_assoc()) {
    $departments[] = $row['department'];
}

$currentFilters = [
    'q' => trim($_GET['q'] ?? ''),
    'vehicle' => $_GET['vehicle'] ?? 'all',
    'department' => trim($_GET['department'] ?? ''),
    'municipality' => trim($_GET['municipality'] ?? ''),
    'max_price' => isset($_GET['max_price']) && is_numeric($_GET['max_price']) ? (float) $_GET['max_price'] : 50,
    'reservable' => $_GET['reservable'] ?? 'all',
    'date' => trim($_GET['date'] ?? ''),
    'favorites' => isset($_GET['favorites']) ? '1' : '0',
    'specs' => isset($_GET['specs']) ? (array) $_GET['specs'] : [],
];

$hasActiveAdvancedFilters =
    $currentFilters['vehicle'] !== 'all' ||
    $currentFilters['department'] !== '' ||
    $currentFilters['municipality'] !== '' ||
    $currentFilters['max_price'] < 50 ||
    $currentFilters['reservable'] !== 'all' ||
    $currentFilters['date'] !== '' ||
    $currentFilters['favorites'] === '1' ||
    !empty($currentFilters['specs']);

$userSpecs = [];
if ($isLoggedIn) {
    $specsSql = "SELECT ust.id, ust.name, ust.icon, us.value
                 FROM user_specification_types ust
                 LEFT JOIN user_specifications us
                    ON ust.id = us.specification_type_id AND us.user_id = $userId
                 ORDER BY ust.name";
    $specsResult = $conex->query($specsSql);
    while ($row = $specsResult->fetch_assoc()) {
        $userSpecs[] = $row;
    }
}

$conditions = ["p.status = 'activo'"];

if ($currentFilters['q'] !== '') {
    $searchTerm = $conex->real_escape_string($currentFilters['q']);
    $searchLike = '%' . $searchTerm . '%';
    $conditions[] = "(p.name LIKE '{$searchLike}' OR p.description LIKE '{$searchLike}' OR l.department LIKE '{$searchLike}' OR l.municipality LIKE '{$searchLike}')";
}

if ($currentFilters['vehicle'] !== 'all' && ctype_digit((string) $currentFilters['vehicle'])) {
    $vehicleId = (int) $currentFilters['vehicle'];
    $conditions[] = "EXISTS (
        SELECT 1
        FROM parking_vehicle_capacities pvc
        WHERE pvc.parking_id = p.id
          AND pvc.vehicle_type_id = {$vehicleId}
          AND pvc.capacity > 0
    )";
}

if ($currentFilters['department'] !== '') {
    $department = $conex->real_escape_string($currentFilters['department']);
    $conditions[] = "l.department = '{$department}'";
}

if ($currentFilters['municipality'] !== '') {
    $municipality = $conex->real_escape_string($currentFilters['municipality']);
    $conditions[] = "l.municipality = '{$municipality}'";
}

if ($currentFilters['date'] !== '') {
    $dayMap = [
        'monday' => 'lunes',
        'tuesday' => 'martes',
        'wednesday' => 'miercoles',
        'thursday' => 'jueves',
        'friday' => 'viernes',
        'saturday' => 'sabado',
        'sunday' => 'domingo',
    ];

    if (isset($dayMap[$currentFilters['date']])) {
        $jsonPath = '$."' . $dayMap[$currentFilters['date']] . '"';
        $conditions[] = "(p.is_24_7 = 1 OR JSON_LENGTH(COALESCE(JSON_EXTRACT(p.schedule, '{$jsonPath}'), JSON_ARRAY())) > 0)";
    }
}

if ($isLoggedIn && $currentFilters['favorites'] === '1') {
    $conditions[] = "EXISTS (
        SELECT 1
        FROM favorites f
        WHERE f.parking_id = p.id
          AND f.user_id = {$userId}
    )";
}

if ($currentFilters['max_price'] < 50) {
    $maxPrice = (float) $currentFilters['max_price'];
    $conditions[] = "EXISTS (
        SELECT 1
        FROM parking_fees pf
        WHERE pf.parking_id = p.id
          AND pf.fee_type = 'normal'
          AND CAST(REPLACE(pf.price, ',', '.') AS DECIMAL(10,2)) <= {$maxPrice}
    )";
}

if ($currentFilters['reservable'] === 'yes') {
    $conditions[] = "EXISTS (
        SELECT 1
        FROM parking_vehicle_capacities pvc
        WHERE pvc.parking_id = p.id
          AND pvc.reservable_vehicle_c > 0
    )";
} elseif ($currentFilters['reservable'] === 'no') {
    $conditions[] = "NOT EXISTS (
        SELECT 1
        FROM parking_vehicle_capacities pvc
        WHERE pvc.parking_id = p.id
          AND pvc.reservable_vehicle_c > 0
    )";
}

if ($isLoggedIn && !empty($currentFilters['specs'])) {
    $selectedSpecs = array_map('intval', $currentFilters['specs']);
    $userHeight = null;

    if (in_array(6, $selectedSpecs, true)) {
        $heightSql = "SELECT value FROM user_specifications WHERE user_id = $userId AND specification_type_id = 6 LIMIT 1";
        $heightResult = $conex->query($heightSql);
        if ($heightResult && $heightResult->num_rows > 0) {
            $userHeight = (float) $heightResult->fetch_assoc()['value'];
        }
    }

    foreach ($selectedSpecs as $specId) {
        switch ($specId) {
            case 1:
                $conditions[] = "EXISTS (
                    SELECT 1 FROM parking_capacities pc
                    WHERE pc.parking_id = p.id AND pc.disability_spaces > 0
                )";
                break;
            case 2:
                $conditions[] = "EXISTS (
                    SELECT 1 FROM parking_capacities pc
                    WHERE pc.parking_id = p.id AND pc.taxi_spaces > 0
                )";
                break;
            case 3:
                $conditions[] = "EXISTS (
                    SELECT 1 FROM parking_capacities pc
                    WHERE pc.parking_id = p.id AND pc.pregnant_people_spaces > 0
                )";
                break;
            case 4:
                $conditions[] = "EXISTS (
                    SELECT 1 FROM parking_services ps
                    JOIN services s ON s.id = ps.service_id
                    WHERE ps.parking_id = p.id AND s.name = 'Mascotas permitidas'
                )";
                break;
            case 5:
                $conditions[] = "EXISTS (
                    SELECT 1 FROM parking_services ps
                    JOIN services s ON s.id = ps.service_id
                    WHERE ps.parking_id = p.id AND s.name = 'Carga para autos elÃ©ctricos'
                )";
                break;
            case 6:
                if ($userHeight !== null) {
                    $conditions[] = "EXISTS (
                        SELECT 1 FROM parking_restrictions pr
                        WHERE pr.parking_id = p.id AND pr.max_height >= {$userHeight}
                    )";
                }
                break;
        }
    }
}

$sql = "SELECT p.id, p.name, l.department, l.municipality,
               p.schedule, p.is_24_7, r.rating, pi.image_url
        FROM parkings p
        JOIN locations l ON p.location_id = l.id
        LEFT JOIN (
            SELECT parking_id, AVG(rating) AS rating
            FROM reviews
            GROUP BY parking_id
        ) r ON r.parking_id = p.id
        LEFT JOIN (
            SELECT parking_id, image_url
            FROM parking_images
            WHERE is_primary = 1
        ) pi ON pi.parking_id = p.id
        WHERE " . implode(' AND ', $conditions) . "
        ORDER BY p.created_at DESC";

$result = $conex->query($sql);

include 'includes/header.php';
?>

<div id="auth-status" data-is-logged-in="<?= $isLoggedIn ? 'true' : 'false' ?>" style="display: none;"></div>

<link rel="stylesheet" href="assets/css/pages/parqueos-publicados.css">

<div class="container">
    <div class="page-header">
        <h1>¡Aquí está lo que <span class="highlight">buscas</span>!</h1>
        <p class="page-intro">Busca por nombre, aplica filtros útiles y encuentra parqueos que sí respondan a tus necesidades reales.</p>
    </div>

    <form class="search-container" id="search-form">
        <div class="search-primary">
            <div class="search-bar">
                <i class="fas fa-search"></i>
                <input type="text" id="search-input" name="q" value="<?= htmlspecialchars($currentFilters['q']) ?>" placeholder="Buscar parqueo, municipio o zona...">
            </div>
            <button class="search-submit-btn" id="search-submit" type="submit">
                <i class="fas fa-search"></i> Buscar
            </button>
        </div>
        <button class="filter-btn <?= $hasActiveAdvancedFilters ? 'active' : '' ?>" id="filter-btn" type="button" aria-expanded="<?= $hasActiveAdvancedFilters ? 'true' : 'false' ?>">
            <i class="fas fa-sliders-h"></i> <?= $hasActiveAdvancedFilters ? 'Filtros activos' : 'Mostrar filtros' ?>
        </button>
    </form>

    <section class="inline-ad-slot">
        <div class="inline-ad-slot__content">
            <span class="inline-ad-slot__eyebrow">Espacio disponible</span>
            <h3>Anunciate aqui</h3>
            <p>Muestra negocios cercanos, servicios automotrices o promociones locales justo cuando el usuario busca parqueo.</p>
        </div>
        <a href="about.php" class="inline-ad-slot__cta">Más información</a>
    </section>

    <div class="filters-container <?= $hasActiveAdvancedFilters ? 'is-open' : '' ?>" id="filters-container">
        <form id="filters-form">
            <?php if (!empty($userVehicles)): ?>
            <div class="filter-group">
                <label>Mi vehículo:</label>
                <div class="vehicle-options">
                    <?php foreach ($userVehicles as $vehicle): ?>
                    <label class="vehicle-option">
                        <input type="radio" name="vehicle" value="<?= $vehicle['id'] ?>" <?= (string) $currentFilters['vehicle'] === (string) $vehicle['id'] ? 'checked' : '' ?>>
                        <i class="fas fa-<?= $vehicle['id'] == 1 ? 'motorcycle' : ($vehicle['id'] == 9 ? 'bicycle' : 'car') ?>"></i>
                        <?= htmlspecialchars($vehicle['category_name']) ?>
                    </label>
                    <?php endforeach; ?>
                    <label class="vehicle-option">
                        <input type="radio" name="vehicle" value="all" <?= $currentFilters['vehicle'] === 'all' ? 'checked' : '' ?>>
                        <i class="fas fa-globe"></i> Todos los vehículos
                    </label>
                </div>
            </div>
            <?php endif; ?>

            <div class="filter-group">
                <label><i class="fas fa-map-marker-alt"></i> Ubicación:</label>
                <div class="location-filters">
                    <select name="department" id="department-filter">
                        <option value="">Todos los departamentos</option>
                        <?php foreach ($departments as $dept): ?>
                        <option value="<?= htmlspecialchars($dept) ?>" <?= $currentFilters['department'] === $dept ? 'selected' : '' ?>><?= htmlspecialchars($dept) ?></option>
                        <?php endforeach; ?>
                    </select>

                    <select name="municipality" id="municipality-filter" <?= $currentFilters['department'] === '' ? 'disabled' : '' ?>>
                        <option value="">Todos los municipios</option>
                    </select>
                </div>
            </div>

            <div class="filter-group">
                <label><i class="fas fa-tag"></i> Precio máximo estimado:</label>
                <div class="price-filter">
                    <input type="range" name="max_price" id="max-price" min="0" max="50" step="0.5" value="<?= htmlspecialchars((string) $currentFilters['max_price']) ?>">
                    <div class="price-values">
                        <span>$0</span>
                        <span id="current-price">$<?= number_format($currentFilters['max_price'], 2) ?></span>
                        <span>$50+</span>
                    </div>
                </div>
            </div>

            <div class="filter-group">
                <label><i class="fas fa-calendar-check"></i> Reservas:</label>
                <div class="reservation-options">
                    <label class="reservation-option">
                        <input type="radio" name="reservable" value="all" <?= $currentFilters['reservable'] === 'all' ? 'checked' : '' ?>>
                        <i class="fas fa-globe"></i> Todos
                    </label>
                    <label class="reservation-option">
                        <input type="radio" name="reservable" value="yes" <?= $currentFilters['reservable'] === 'yes' ? 'checked' : '' ?>>
                        <i class="fas fa-check-circle" style="color: #4CAF50;"></i> Solo reservables
                    </label>
                    <label class="reservation-option">
                        <input type="radio" name="reservable" value="no" <?= $currentFilters['reservable'] === 'no' ? 'checked' : '' ?>>
                        <i class="fas fa-times-circle" style="color: #f44336;"></i> No reservables
                    </label>
                </div>
            </div>

            <div class="filter-group">
                <label><i class="far fa-clock"></i> Disponible en:</label>
                <select name="date" id="date-filter">
                    <option value="">Cualquier día</option>
                    <option value="monday" <?= $currentFilters['date'] === 'monday' ? 'selected' : '' ?>>Lunes</option>
                    <option value="tuesday" <?= $currentFilters['date'] === 'tuesday' ? 'selected' : '' ?>>Martes</option>
                    <option value="wednesday" <?= $currentFilters['date'] === 'wednesday' ? 'selected' : '' ?>>Miércoles</option>
                    <option value="thursday" <?= $currentFilters['date'] === 'thursday' ? 'selected' : '' ?>>Jueves</option>
                    <option value="friday" <?= $currentFilters['date'] === 'friday' ? 'selected' : '' ?>>Viernes</option>
                    <option value="saturday" <?= $currentFilters['date'] === 'saturday' ? 'selected' : '' ?>>Sábado</option>
                    <option value="sunday" <?= $currentFilters['date'] === 'sunday' ? 'selected' : '' ?>>Domingo</option>
                </select>
            </div>

            <?php if (!empty($userSpecs)): ?>
            <div class="filter-group">
                <label><i class="fas fa-user-cog"></i> Mis necesidades:</label>
                <div class="specs-options">
                    <?php foreach ($userSpecs as $spec): ?>
                    <?php $isActive = in_array((string) $spec['id'], array_map('strval', $currentFilters['specs']), true); ?>
                    <label class="spec-option <?= $isActive ? 'active' : '' ?>" data-spec-id="<?= $spec['id'] ?>">
                        <input type="checkbox" name="specs[]" value="<?= $spec['id'] ?>" <?= $isActive ? 'checked' : '' ?>>
                        <i class="fas fa-<?= htmlspecialchars($spec['icon']) ?>"></i>
                        <?= htmlspecialchars($spec['name']) ?>
                        <?php if (!is_null($spec['value']) && $spec['value'] !== ''): ?>
                        <span class="spec-value">(<?= htmlspecialchars((string) $spec['value']) ?>)</span>
                        <?php endif; ?>
                    </label>
                    <?php endforeach; ?>
                </div>
            </div>
            <?php endif; ?>

            <?php if ($isLoggedIn): ?>
            <div class="filter-group">
                <label class="favorites-filter">
                    <input type="checkbox" name="favorites" value="1" <?= $currentFilters['favorites'] === '1' ? 'checked' : '' ?>>
                    <i class="fas fa-heart" style="color: #e91e63;"></i> Solo mis favoritos
                </label>
            </div>
            <?php endif; ?>

            <div class="filter-buttons">
                <button type="button" id="apply-filters" class="btn-primary">
                    <i class="fas fa-check"></i> Aplicar filtros
                </button>
                <button type="button" id="reset-filters" class="btn-secondary">
                    <i class="fas fa-times"></i> Limpiar filtros
                </button>
            </div>
        </form>
    </div>

    <h2 class="section-title">Parqueos disponibles</h2>

    <div class="parkings-grid" id="parkings-container">
        <?php if ($result && $result->num_rows > 0): ?>
            <?php while ($parking = $result->fetch_assoc()): ?>
                <?php
                $rating = $parking['rating'];
                $isNew = empty($rating) || $rating == 0;
                $imageUrl = $parking['image_url'] ?: 'assets/images/parking deffault.png';
                $scheduleData = htmlspecialchars($parking['schedule'] ?? '[]', ENT_QUOTES, 'UTF-8');
                $is24_7 = (int) ($parking['is_24_7'] ?? 0);
                ?>
                <div class="parking-card-container">
                    <div class="parking-card" data-parking-id="<?= $parking['id'] ?>" data-schedule="<?= $scheduleData ?>" data-is-24-7="<?= $is24_7 ?>">
                        <div class="save-icon" data-parking-id="<?= $parking['id'] ?>">
                            <i class="far fa-bookmark"></i>
                        </div>
                        <a href="detalles-parqueo.php?id=<?= $parking['id'] ?>" class="parking-card-link">
                            <div class="card-image">
                                <img src="<?= htmlspecialchars($imageUrl) ?>" alt="<?= htmlspecialchars($parking['name']) ?>">
                            </div>
                            <div class="card-content">
                                <h3><?= htmlspecialchars($parking['name']) ?></h3>
                                <div class="location"><?= htmlspecialchars($parking['department']) ?>, <?= htmlspecialchars($parking['municipality']) ?></div>
                                <div class="schedule-rating">
                                    <div class="schedule-status-container">
                                        <div class="schedule">
                                            <i class="far fa-clock"></i>
                                            <span class="schedule-text"></span>
                                        </div>
                                        <div class="open-status"></div>
                                    </div>
                                    <?php if ($isNew): ?>
                                        <div class="new-badge">Nuevo</div>
                                    <?php else: ?>
                                        <div class="rating"><?= number_format($rating, 1) ?> ★</div>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </a>
                    </div>
                </div>
            <?php endwhile; ?>
        <?php else: ?>
            <div class="empty-results">
                <i class="fas fa-search-location"></i>
                <h3>No encontramos parqueos con esos filtros</h3>
                <p>Prueba limpiando filtros o buscando por otra zona, municipio o tipo de necesidad.</p>
                <a href="parqueos-publicados.php" class="inline-ad-slot__cta">Ver todos</a>
            </div>
        <?php endif; ?>
    </div>
</div>

<?php
$conex->close();
include 'includes/footer.php';
?>

<script src="assets/js/pages/parqueos-publicados.js"></script>
