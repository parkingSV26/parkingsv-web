import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import {
  getDemoAccountPreset,
  parseDemoAccountKind,
  type DemoAccountKind,
} from "@/app/lib/auth/demo-accounts";
import { db, type DatabaseRow } from "@/app/lib/db";

// El proyecto sigue en modo demo para varios recorridos, pero mantiene soporte para sesión real en paralelo.
const AUTH_DEMO_MODE = true;
const DEMO_SESSION_COOKIE_NAME = "parking_sv_demo_session";
const SESSION_COOKIE_NAME = "parking_sv_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;
const DEFAULT_AVATAR = "/parkingsv/default-avatar.jpeg";
const LEGACY_UPLOAD_PREFIX = "/crud-php2/public/uploads/";

type UserType = "customer" | "owner";

type SessionUserRow = DatabaseRow & {
  id: number;
  full_name: string;
  email: string;
  user_type: UserType;
  profile_picture: string | null;
};

export type SessionUser = {
  id: number;
  fullName: string;
  email: string;
  userType: UserType;
  profilePicture: string;
};

type DemoSessionPayload = {
  email: string;
  fullName: string;
  id: number;
  profilePicture: string;
  userType: UserType;
};

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function resolveProfilePicture(profilePicture: string | null) {
  // Traducimos rutas heredadas del PHP a assets servidos por Next sin romper perfiles antiguos.
  if (!profilePicture) {
    return DEFAULT_AVATAR;
  }

  if (profilePicture.startsWith(LEGACY_UPLOAD_PREFIX)) {
    return `/legacy-assets/${profilePicture.slice(LEGACY_UPLOAD_PREFIX.length)}`;
  }

  if (profilePicture.startsWith("/crud-php2/assets/images/")) {
    return DEFAULT_AVATAR;
  }

  return profilePicture;
}

function mapSessionUser(user: SessionUserRow): SessionUser {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    userType: user.user_type,
    profilePicture: resolveProfilePicture(user.profile_picture),
  };
}

async function readSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

async function readDemoSession() {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(DEMO_SESSION_COOKIE_NAME)?.value;

  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as DemoSessionPayload;

    if (
      !parsedValue ||
      typeof parsedValue.email !== "string" ||
      typeof parsedValue.fullName !== "string" ||
      typeof parsedValue.id !== "number" ||
      typeof parsedValue.profilePicture !== "string" ||
      (parsedValue.userType !== "customer" && parsedValue.userType !== "owner")
    ) {
      return null;
    }

    return parsedValue;
  } catch {
    return null;
  }
}

function normalizeProfileName(email: string) {
  const localPart = email.split("@")[0] ?? "usuario";
  const cleanedValue = localPart
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanedValue) {
    return "Usuario Parking SV";
  }

  return cleanedValue
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function createDemoUserSession(
  email: string,
  overrides: Partial<Pick<DemoSessionPayload, "fullName" | "profilePicture" | "userType">> = {},
) {
  const cookieStore = await cookies();
  // Generamos un perfil estable a partir del correo para que la sesión demo se sienta persistente.
  const normalizedEmail = email.trim().toLowerCase() || "usuario@parkingsv.com";
  const demoSession: DemoSessionPayload = {
    email: normalizedEmail,
    fullName: overrides.fullName?.trim() || normalizeProfileName(normalizedEmail),
    id: Math.abs(
      normalizedEmail.split("").reduce((total, character) => total + character.charCodeAt(0), 0),
    ),
    profilePicture: overrides.profilePicture || DEFAULT_AVATAR,
    userType: overrides.userType || "customer",
  };

  cookieStore.set({
    name: DEMO_SESSION_COOKIE_NAME,
    value: JSON.stringify(demoSession),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function createStaticDemoAccountSession(accountKind: DemoAccountKind) {
  const account = getDemoAccountPreset(parseDemoAccountKind(accountKind));
  const cookieStore = await cookies();

  cookieStore.set({
    name: DEMO_SESSION_COOKIE_NAME,
    value: JSON.stringify({
      id: account.id,
      userType: account.userType,
      email: account.email,
      fullName: account.fullName,
      profilePicture: account.profilePicture,
    } satisfies DemoSessionPayload),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function createUserSession(userId: number) {
  if (AUTH_DEMO_MODE) {
    await createDemoUserSession(`usuario-${userId}@parkingsv.com`, {
      fullName: `Usuario ${userId}`,
    });
    return;
  }

  const sessionToken = randomBytes(32).toString("base64url");
  const sessionTokenHash = hashSessionToken(sessionToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);

  await db.execute(
    `
      INSERT INTO sessions (user_id, session_token, expires_at, last_active)
      VALUES (?, ?, ?, NOW())
    `,
    [userId, sessionTokenHash, expiresAt],
  );

  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: sessionToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearUserSession() {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_SESSION_COOKIE_NAME);
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionUser() {
  const demoSession = await readDemoSession();

  if (demoSession) {
    return {
      email: demoSession.email,
      fullName: demoSession.fullName,
      id: demoSession.id,
      profilePicture: demoSession.profilePicture,
      userType: demoSession.userType,
    };
  }

  if (AUTH_DEMO_MODE) {
    return null;
  }

  const sessionToken = await readSessionToken();

  if (!sessionToken) {
    return null;
  }

  const sessionTokenHash = hashSessionToken(sessionToken);
  const [rows] = await db.execute<SessionUserRow[]>(
    `
      SELECT u.id, u.full_name, u.email, u.user_type, u.profile_picture
      FROM sessions s
      INNER JOIN users u ON u.id = s.user_id
      WHERE s.session_token = ?
        AND (s.expires_at IS NULL OR s.expires_at > NOW())
      LIMIT 1
    `,
    [sessionTokenHash],
  );

  const user = rows[0];

  if (!user) {
    return null;
  }

  await db.execute("UPDATE sessions SET last_active = NOW() WHERE session_token = ?", [sessionTokenHash]);

  return mapSessionUser(user);
}
