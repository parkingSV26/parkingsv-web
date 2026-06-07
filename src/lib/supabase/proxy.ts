import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/src/lib/supabase/public";

const AUTH_PAGES = ["/login", "/register"];
const PROTECTED_PREFIXES = [
  "/account",
  "/my-parkings",
  "/my-reservations",
  "/notifications",
  "/publish-parking",
  "/saved",
  "/settings",
  "/mi-cuenta",
  "/mis-parqueos",
  "/mis-reservas",
  "/notificaciones",
  "/publicar-parqueo",
  "/guardados",
  "/configuracion",
];

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isAuthPage(pathname: string) {
  return AUTH_PAGES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  let isAuthenticated = false;

  try {
    const { data, error } = await supabase.auth.getUser();
    isAuthenticated = Boolean(data.user?.id) && !error;
  } catch {
    isAuthenticated = false;
  }

  response.headers.set("Cache-Control", "private, no-store");

  const { pathname, search } = request.nextUrl;

  if (!isAuthenticated && isProtectedPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isAuthPage(pathname)) {
    const accountUrl = request.nextUrl.clone();
    accountUrl.pathname = "/mi-cuenta";
    accountUrl.search = "";
    return NextResponse.redirect(accountUrl);
  }

  return response;
}
