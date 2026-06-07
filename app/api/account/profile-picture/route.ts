import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { getAvatarBucketName } from "@/src/lib/supabase/server-env";
import { getSessionUser } from "@/app/lib/auth/session";
import { resolveAccountProfilePicture } from "@/app/lib/account";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const mimeToExtension: Record<string, string> = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function ensureAvatarBucket() {
  const admin = createSupabaseAdminClient();
  const bucketName = getAvatarBucketName();
  const { error } = await admin.storage.createBucket(bucketName, {
    allowedMimeTypes: Object.keys(mimeToExtension),
    fileSizeLimit: MAX_FILE_SIZE,
    public: true,
  });

  if (error && !/exists|duplicate/i.test(error.message)) {
    throw error;
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const fileEntry = formData.get("profile_picture");

    if (!(fileEntry instanceof File)) {
      return Response.json({ error: "No se recibio ninguna imagen." }, { status: 400 });
    }

    if (!(fileEntry.type in mimeToExtension)) {
      return Response.json(
        { error: "Solo se permiten imagenes JPEG, PNG, WEBP o GIF." },
        { status: 400 },
      );
    }

    if (fileEntry.size > MAX_FILE_SIZE) {
      return Response.json({ error: "La imagen debe ser menor a 2MB." }, { status: 400 });
    }

    await ensureAvatarBucket();

    const admin = createSupabaseAdminClient();
    const extension = mimeToExtension[fileEntry.type];
    const avatarPath = `${user.authUserId}/avatar-${Date.now()}-${randomUUID()}.${extension}`;
    const uploadResult = await admin.storage
      .from(getAvatarBucketName())
      .upload(avatarPath, await fileEntry.arrayBuffer(), {
        cacheControl: "3600",
        contentType: fileEntry.type,
        upsert: true,
      });

    if (uploadResult.error) {
      throw uploadResult.error;
    }

    const { data: publicUrlData } = admin.storage
      .from(getAvatarBucketName())
      .getPublicUrl(avatarPath);

    const profilePicture = publicUrlData.publicUrl;
    const { error } = await admin
      .from("users")
      .update({ profile_picture: profilePicture })
      .eq("id", user.id);

    if (error) {
      throw error;
    }

    return Response.json({
      newPath: `${resolveAccountProfilePicture(profilePicture)}?v=${Date.now()}`,
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
