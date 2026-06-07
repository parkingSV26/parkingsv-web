import {
  createFavoriteFolderForUser,
  getSavedParkingStateForUser,
  removeFavoriteForUser,
  removeFavoriteFromFolder,
  setFavoriteFolderForUser,
  toggleFavoriteForUser,
} from "@/app/lib/favorites";
import { getSessionUser } from "@/app/lib/auth/session";

export const dynamic = "force-dynamic";

type FavoriteActionPayload =
  | {
      action: "create_folder";
      color?: string;
      name?: string;
      parkingIds?: unknown;
    }
  | {
      action: "remove_favorite";
      parkingId?: unknown;
    }
  | {
      action: "save_favorite";
      folderId?: unknown;
      parkingId?: unknown;
    }
  | {
      action: "remove_from_folder";
      folderId?: unknown;
      parkingId?: unknown;
    }
  | {
      action: "toggle";
      parkingId?: unknown;
    };

function parseParkingId(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseOptionalFolderId(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return parseParkingId(value);
}

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as FavoriteActionPayload;

    switch (payload.action) {
      case "toggle": {
        const parkingId = parseParkingId(payload.parkingId);
        if (!parkingId) {
          return Response.json({ error: "Parqueo invalido." }, { status: 400 });
        }
        await toggleFavoriteForUser(user.id, parkingId);
        break;
      }
      case "create_folder": {
        const parkingIds = Array.isArray(payload.parkingIds)
          ? payload.parkingIds
              .map((parkingId) => parseParkingId(parkingId))
              .filter((parkingId): parkingId is number => parkingId !== null)
          : [];

        await createFavoriteFolderForUser(user.id, {
          color: typeof payload.color === "string" ? payload.color : "#0C6FF9",
          name: typeof payload.name === "string" ? payload.name : "",
          parkingIds,
        });
        break;
      }
      case "remove_favorite": {
        const parkingId = parseParkingId(payload.parkingId);
        if (!parkingId) {
          return Response.json({ error: "Parqueo invalido." }, { status: 400 });
        }
        await removeFavoriteForUser(user.id, parkingId);
        break;
      }
      case "save_favorite": {
        const parkingId = parseParkingId(payload.parkingId);
        const folderId = parseOptionalFolderId(payload.folderId);

        if (!parkingId) {
          return Response.json({ error: "Parqueo invalido." }, { status: 400 });
        }

        await setFavoriteFolderForUser(user.id, parkingId, folderId);
        break;
      }
      case "remove_from_folder": {
        const parkingId = parseParkingId(payload.parkingId);
        const folderId = parseParkingId(payload.folderId);
        if (!parkingId || !folderId) {
          return Response.json({ error: "Carpeta o parqueo invalido." }, { status: 400 });
        }
        await removeFavoriteFromFolder(user.id, folderId, parkingId);
        break;
      }
      default:
        return Response.json({ error: "Accion invalida." }, { status: 400 });
    }

    const state = await getSavedParkingStateForUser(user.id);
    return Response.json({ state, success: true });
  } catch (error) {
    console.error("Failed to update favorites.", error);
    return Response.json({ error: "No se pudieron actualizar los guardados." }, { status: 500 });
  }
}
