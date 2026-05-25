import { getSessionUser } from "@/app/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  // La sesión cambia por cookie, así que esta respuesta no debe quedar estática.
  const user = await getSessionUser();

  return Response.json({ user });
}
