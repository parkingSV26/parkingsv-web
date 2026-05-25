<?php

function obtenerCarpeta(mysqli $conex, int $folderId): ?array
{
    $sqlFolder = "SELECT f.*, u.full_name AS owner_name
                  FROM favorite_folders f
                  JOIN users u ON f.user_id = u.id
                  WHERE f.id = ?
                  LIMIT 1";
    $stmtFolder = $conex->prepare($sqlFolder);
    $stmtFolder->bind_param("i", $folderId);
    $stmtFolder->execute();
    $folder = $stmtFolder->get_result()->fetch_assoc() ?: null;
    $stmtFolder->close();

    return $folder;
}

function obtenerParqueosCarpeta(mysqli $conex, int $folderId): array
{
    $sqlParkings = "SELECT p.id, p.name, l.department, l.municipality,
                           CONCAT(JSON_UNQUOTE(JSON_EXTRACT(p.schedule, '$.lunes.apertura')), ' - ',
                                  JSON_UNQUOTE(JSON_EXTRACT(p.schedule, '$.lunes.cierre'))) AS horario,
                           (SELECT AVG(rating) FROM reviews WHERE parking_id = p.id) AS rating,
                           (SELECT image_url FROM parking_images WHERE parking_id = p.id AND is_primary = 1 LIMIT 1) AS image_url
                    FROM favorites f
                    JOIN parkings p ON f.parking_id = p.id
                    JOIN locations l ON p.location_id = l.id
                    WHERE f.folder_id = ?
                    ORDER BY f.created_at DESC";

    $stmtParkings = $conex->prepare($sqlParkings);
    $stmtParkings->bind_param("i", $folderId);
    $stmtParkings->execute();
    $result = $stmtParkings->get_result();

    $parkings = [];
    while ($row = $result->fetch_assoc()) {
        $parkings[] = $row;
    }

    $stmtParkings->close();
    return $parkings;
}

function obtenerFavoritosUsuario(mysqli $conex, int $userId, int $folderId = 0): array
{
    $sqlFavorites = "SELECT p.id,
                            p.name,
                            l.department,
                            l.municipality,
                            MAX(CASE WHEN f.folder_id = ? THEN 1 ELSE 0 END) AS in_current_folder,
                            MAX(CASE WHEN f.folder_id IS NULL THEN 1 ELSE 0 END) AS has_loose_favorite,
                            GROUP_CONCAT(
                                DISTINCT CASE
                                    WHEN f.folder_id IS NOT NULL AND f.folder_id <> ? THEN ff.name
                                    ELSE NULL
                                END
                                ORDER BY ff.name SEPARATOR '||'
                            ) AS other_folder_names
                     FROM favorites f
                     JOIN parkings p ON f.parking_id = p.id
                     JOIN locations l ON p.location_id = l.id
                     LEFT JOIN favorite_folders ff ON ff.id = f.folder_id
                     WHERE f.user_id = ?
                     GROUP BY p.id, p.name, l.department, l.municipality
                     ORDER BY in_current_folder DESC, p.name ASC";

    $stmtFavorites = $conex->prepare($sqlFavorites);
    $stmtFavorites->bind_param("iii", $folderId, $folderId, $userId);
    $stmtFavorites->execute();
    $result = $stmtFavorites->get_result();

    $favorites = [];
    while ($row = $result->fetch_assoc()) {
        $favorites[] = $row;
    }

    $stmtFavorites->close();
    return $favorites;
}
