import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";
import { getSupabaseBrowserEnv } from "./env";

const protectedRoutes = ["/", "/movimientos", "/estadisticas", "/ahorros", "/configuracion"];
const publicAuthRoutes = ["/login", "/registro"];

function isProtectedPath(pathname: string) {
  return protectedRoutes.some((route) => pathname === route || (route !== "/" && pathname.startsWith(`${route}/`)));
}

function isPublicAuthPath(pathname: string) {
  return publicAuthRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, publishableKey } = getSupabaseBrowserEnv();

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!user && isProtectedPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isPublicAuthPath(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}
