import { getSessionUser } from "@/app/lib/auth/session";
import { resolveAccountProfilePicture } from "@/app/lib/account";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ parkingId: string }>;
};

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getSessionUser();

  if (!user) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  const { parkingId } = await params;
  const parsedParkingId = Number(parkingId);

  if (!Number.isInteger(parsedParkingId) || parsedParkingId <= 0) {
    return Response.json({ error: "Parqueo invalido." }, { status: 400 });
  }

  try {
    const payload = (await request.json()) as {
      comment?: unknown;
      rating?: unknown;
    };

    const rating = Number(payload.rating);
    const comment = typeof payload.comment === "string" ? payload.comment.trim() : "";

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return Response.json({ error: "Calificacion invalida." }, { status: 400 });
    }

    if (!comment) {
      return Response.json({ error: "Escribe un comentario para la reseña." }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("reviews")
      .insert({
        comment,
        parking_id: parsedParkingId,
        rating,
        user_id: user.id,
      })
      .select("id, comment, rating, created_at")
      .single();

    if (error) {
      throw error;
    }

    return Response.json({
      review: {
        author: user.fullName,
        avatar: resolveAccountProfilePicture(user.profilePicture),
        comment: data.comment,
        createdAt: data.created_at,
        id: String(data.id),
        rating: data.rating,
      },
      success: true,
    });
  } catch (error) {
    console.error("Failed to create review.", error);
    return Response.json({ error: "No se pudo guardar la reseña." }, { status: 500 });
  }
}
