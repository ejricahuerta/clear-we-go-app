import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { SUPABASE_AUTH_COOKIE_NAME } from "@/lib/supabase/cookie-name";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: SUPABASE_AUTH_COOKIE_NAME },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Unauthenticated: invite setup + login API
  const path = request.nextUrl.pathname;
  if (path.startsWith("/api/invite/") || path === "/api/auth/login") {
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute = request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/auth") || request.nextUrl.pathname.startsWith("/setup");
  if (isAuthRoute) {
    if (user) {
      const service = createServiceRoleClient();
      const { data: profile } = await service
        .from("users")
        .select("role")
        .eq("auth_user_id", user.id)
        .single();
      if (profile?.role === "crew") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    return response;
  }

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const service = createServiceRoleClient();
  const { data: profile } = await service
    .from("users")
    .select("role")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile || profile.role !== "crew") {
    return NextResponse.redirect(new URL("/login?error=wrong-app", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
