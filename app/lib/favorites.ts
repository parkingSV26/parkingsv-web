import "server-only";

import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { formatSupabaseErrorForLog } from "@/src/lib/supabase/errors";

export type SavedFolder = {
  color: string;
  createdAt: string;
  id: string;
  name: string;
  parkingIds: string[];
};

export type SavedParkingState = {
  favoriteIds: string[];
  folders: SavedFolder[];
};

type FavoriteFolderRow = {
  color: string | null;
  created_at: string;
  id: number;
  name: string;
};

type FavoriteRow = {
  folder_id: number | null;
  parking_id: number;
};

function normalizeParkingId(parkingId: number | string) {
  return String(parkingId);
}

export async function getSavedParkingStateForUser(userId: number): Promise<SavedParkingState> {
  try {
    const admin = createSupabaseAdminClient();
    const [{ data: folderData, error: folderError }, { data: favoriteData, error: favoriteError }] =
      await Promise.all([
        admin
          .from("favorite_folders")
          .select("id, name, color, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        admin.from("favorites").select("parking_id, folder_id").eq("user_id", userId),
      ]);

    if (folderError) {
      throw folderError;
    }

    if (favoriteError) {
      throw favoriteError;
    }

    const favorites = (favoriteData ?? []) as FavoriteRow[];
    const folders = ((folderData ?? []) as FavoriteFolderRow[]).map((folder) => ({
      color: folder.color ?? "#0C6FF9",
      createdAt: folder.created_at,
      id: String(folder.id),
      name: folder.name,
      parkingIds: favorites
        .filter((favorite) => favorite.folder_id === folder.id)
        .map((favorite) => normalizeParkingId(favorite.parking_id)),
    }));

    return {
      favoriteIds: Array.from(
        new Set(favorites.map((favorite) => normalizeParkingId(favorite.parking_id))),
      ),
      folders,
    };
  } catch (error) {
    console.warn("Failed to load saved parkings.", formatSupabaseErrorForLog(error));
    return {
      favoriteIds: [],
      folders: [],
    };
  }
}

export async function toggleFavoriteForUser(userId: number, parkingId: number) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("favorites")
    .select("parking_id")
    .eq("user_id", userId)
    .eq("parking_id", parkingId);

  if (error) {
    throw error;
  }

  if ((data ?? []).length > 0) {
    const { error: deleteError } = await admin
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("parking_id", parkingId);

    if (deleteError) {
      throw deleteError;
    }

    return;
  }

  const { error: insertError } = await admin.from("favorites").insert({
    folder_id: null,
    parking_id: parkingId,
    user_id: userId,
  });

  if (insertError) {
    throw insertError;
  }
}

export async function setFavoriteFolderForUser(
  userId: number,
  parkingId: number,
  folderId: number | null,
) {
  const admin = createSupabaseAdminClient();

  if (folderId !== null) {
    const { data: folderData, error: folderError } = await admin
      .from("favorite_folders")
      .select("id")
      .eq("id", folderId)
      .eq("user_id", userId)
      .maybeSingle();

    if (folderError) {
      throw folderError;
    }

    if (!folderData) {
      throw new Error("La carpeta seleccionada no existe o no te pertenece.");
    }
  }

  const { data, error } = await admin
    .from("favorites")
    .select("parking_id")
    .eq("user_id", userId)
    .eq("parking_id", parkingId);

  if (error) {
    throw error;
  }

  if ((data ?? []).length > 0) {
    const { error: updateError } = await admin
      .from("favorites")
      .update({ folder_id: folderId })
      .eq("user_id", userId)
      .eq("parking_id", parkingId);

    if (updateError) {
      throw updateError;
    }

    return;
  }

  const { error: insertError } = await admin.from("favorites").insert({
    folder_id: folderId,
    parking_id: parkingId,
    user_id: userId,
  });

  if (insertError) {
    throw insertError;
  }
}

export async function createFavoriteFolderForUser(
  userId: number,
  input: { color: string; name: string; parkingIds: number[] },
) {
  const admin = createSupabaseAdminClient();
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    return;
  }

  const { data: folderData, error: folderError } = await admin
    .from("favorite_folders")
    .insert({
      color: input.color || "#0C6FF9",
      name: trimmedName,
      user_id: userId,
    })
    .select("id")
    .single();

  if (folderError) {
    throw folderError;
  }

  const folderId = folderData.id;

  for (const parkingId of input.parkingIds) {
    await setFavoriteFolderForUser(userId, parkingId, folderId);
  }
}

export async function removeFavoriteForUser(userId: number, parkingId: number) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("parking_id", parkingId);

  if (error) {
    throw error;
  }
}

export async function removeFavoriteFromFolder(userId: number, folderId: number, parkingId: number) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("folder_id", folderId)
    .eq("parking_id", parkingId);

  if (error) {
    throw error;
  }

  const { data, error: existingError } = await admin
    .from("favorites")
    .select("parking_id")
    .eq("user_id", userId)
    .eq("parking_id", parkingId);

  if (existingError) {
    throw existingError;
  }

  if ((data ?? []).length === 0) {
    await setFavoriteFolderForUser(userId, parkingId, null);
  }
}
