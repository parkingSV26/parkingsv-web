import { getSessionUser } from "@/app/lib/auth/session";
import { getPublicUserByEmail, updatePublicUserProfileById } from "@/app/lib/auth/user-profile";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { formatSupabaseErrorForLog, getSupabaseFriendlyErrorMessage } from "@/src/lib/supabase/errors";

export const dynamic = "force-dynamic";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as {
      dateOfBirth?: unknown;
      email?: unknown;
      fullName?: unknown;
      phoneNumber?: unknown;
    };

    const fullName = String(payload.fullName ?? "").trim();
    const email = String(payload.email ?? "").trim().toLowerCase();
    const phoneNumber = String(payload.phoneNumber ?? "").trim();
    const dateOfBirth = String(payload.dateOfBirth ?? "").trim();

    if (!fullName) {
      return Response.json({ error: "Ingresa tu nombre completo." }, { status: 400 });
    }

    if (!email) {
      return Response.json({ error: "Ingresa tu correo electrónico." }, { status: 400 });
    }

    if (!emailPattern.test(email)) {
      return Response.json({ error: "Ingresa un correo válido." }, { status: 400 });
    }

    if (!dateOfBirth) {
      return Response.json({ error: "Ingresa tu fecha de nacimiento." }, { status: 400 });
    }

    if (Number.isNaN(Date.parse(dateOfBirth))) {
      return Response.json({ error: "Ingresa una fecha de nacimiento válida." }, { status: 400 });
    }

    const normalizedPhone = phoneNumber.trim() ? phoneNumber.trim() : null;
    const existingUser = await getPublicUserByEmail(email);

    if (existingUser && existingUser.id !== user.id) {
      return Response.json({ error: "Ya existe otra cuenta con ese correo." }, { status: 409 });
    }

    const admin = createSupabaseAdminClient();
    const { data: authData, error: authLoadError } = await admin.auth.admin.getUserById(
      user.authUserId,
    );

    if (authLoadError) {
      throw authLoadError;
    }

    const currentMetadata =
      typeof authData.user?.user_metadata === "object" && authData.user.user_metadata !== null
        ? (authData.user.user_metadata as Record<string, unknown>)
        : {};

    const { error: authUpdateError } = await admin.auth.admin.updateUserById(user.authUserId, {
      email,
      email_confirm: true,
      user_metadata: {
        ...currentMetadata,
        date_of_birth: dateOfBirth,
        full_name: fullName,
      },
    });

    if (authUpdateError) {
      throw authUpdateError;
    }

    let updatedUser;

    try {
      updatedUser = await updatePublicUserProfileById(user.id, {
        dateOfBirth,
        email,
        emailVerified: true,
        fullName,
        phoneNumber: normalizedPhone,
      });
    } catch (profileUpdateError) {
      await admin.auth.admin.updateUserById(user.authUserId, {
        email: user.email,
        email_confirm: Boolean(user.emailVerified),
        user_metadata: currentMetadata,
      });
      throw profileUpdateError;
    }

    if (!updatedUser) {
      throw new Error("No se pudo actualizar el perfil.");
    }

    return Response.json({
      success: true,
      user: {
        dateOfBirth: updatedUser.dateOfBirth,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        id: updatedUser.id,
        phoneNumber: updatedUser.phoneNumber,
      },
    });
  } catch (error) {
    console.error("Failed to update profile.", formatSupabaseErrorForLog(error));

    return Response.json(
      {
        error: getSupabaseFriendlyErrorMessage(error, "No se pudo actualizar el perfil."),
      },
      { status: 500 },
    );
  }
}
