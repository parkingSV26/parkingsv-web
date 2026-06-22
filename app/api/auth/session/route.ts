import { getSessionUser } from "@/app/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  // The session changes through cookies, so this response must not be cached.
  const user = await getSessionUser();

  return Response.json({ user });
}
