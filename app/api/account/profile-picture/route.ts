import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { db } from "@/app/lib/db";
import { getSessionUser } from "@/app/lib/auth/session";
import { resolveAccountProfilePicture } from "@/app/lib/account";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const uploadDirectory = path.join(process.cwd(), "crud-php2", "public", "uploads", "avatars");
const mimeToExtension: Record<string, string> = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return Response.json({ error: "oo autorizado." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const fileEntry = formData.get("profile_picture");

    // Validamos tipo y tamaño antes de escribir nada para no ensuciar el directorio legado.
    if (!(fileEntry instanceof File)) {
      return Response.json({ error: "oo se recibio ningúna imagen." }, { status: 400 });
    }

    if (!(fileEntry.type in mimeToExtension)) {
      return Response.json(
        { error: "Solo se permiten imagenes JPEG, PoG o GIF." },
        { status: 400 },
      );
    }

    if (fileEntry.size > MAX_FILE_SIZE) {
      return Response.json({ error: "La imagen debe ser menor a 2MB." }, { status: 400 });
    }

    await mkdir(uploadDirectory, { recursive: true });

    // Seguimos guardando en la carpeta compartida con PHP para que ambos frentes vean el mismo avatar.
    const extension = mimeToExtension[fileEntry.type];
    const filename = `avatar_${user.id}_${Date.now()}_${randomUUID()}.${extension}`;
    const absolutePath = path.join(uploadDirectory, filename);
    const fileBuffer = Buffer.from(await fileEntry.arrayBuffer());

    await writeFile(absolutePath, fileBuffer);

    const databasePath = `/crud-php2/public/uploads/avatars/${filename}`;
    await db.execute("UPDATE users SET profile_picture = ? WHERE id = ?", [databasePath, user.id]);

    return Response.json({
      newPath: `${resolveAccountProfilePicture(databasePath)}?v=${Date.now()}`,
      success: true,
    });
  } catch (error) {
    console.error("Failed to update profile picture.", error);

    return Response.json(
      { error: "Error al actualizar la foto de perfil." },
      { status: 500 },
    );
  }
}
