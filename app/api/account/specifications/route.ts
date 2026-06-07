import { getAccountPageData } from "@/app/lib/account";
import {
  readAuthMetadata,
  syncSpecificationSelections,
  updateAuthMetadata,
} from "@/app/lib/account-mutations";
import { getSessionUser } from "@/app/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as {
      specifications?: Array<{
        id?: unknown;
        value?: unknown;
      }>;
    };

    const specifications = Array.isArray(payload.specifications)
      ? payload.specifications
          .map((specification) => ({
            id: Number(specification.id),
            value:
              typeof specification.value === "string"
                ? specification.value.trim()
                : specification.value === null || specification.value === undefined
                  ? ""
                  : String(specification.value),
          }))
          .filter((specification) => Number.isInteger(specification.id) && specification.id > 0)
      : [];

    const metadata = await readAuthMetadata(user.authUserId);
    const specificationMap = Object.fromEntries(
      specifications.map((specification) => [String(specification.id), specification.value || "1"]),
    );

    await updateAuthMetadata(user.authUserId, {
      ...metadata,
      user_specifications: specificationMap,
    });
    await syncSpecificationSelections(user.id, specifications);

    const accountData = await getAccountPageData(user);

    return Response.json({
      specifications: accountData?.specifications ?? [],
      success: true,
    });
  } catch (error) {
    console.error("Failed to update specifications.", error);

    return Response.json(
      { error: "Error al actualizar las especificaciones del usuario." },
      { status: 500 },
    );
  }
}
