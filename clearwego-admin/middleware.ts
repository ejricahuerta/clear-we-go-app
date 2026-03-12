import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const ADMIN_ROLES = ["owner", "admin"];

/** Canonical app URL for redirects (avoids localhost in production). Set NEXT_PUBLIC_APP_URL e.g. https://admin.clearwego.ca */
function getBaseUrl(request: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env) return env.replace(/\/$/, "");
  return request.nextUrl.origin;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const base = getBaseUrl(request);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute = request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/auth");
  if (isAuthRoute) {
    if (user) {
      const service = createServiceRoleClient();
      const { data: profile } = await service
        .from("users")
        .select("role")
        .eq("auth_user_id", user.id)
        .single();
      if (profile && ADMIN_ROLES.includes(profile.role)) {
        return NextResponse.redirect(new URL("/", base));
      }
    }
    return response;
  }

  if (!user) {
    return NextResponse.redirect(new URL("/login", base));
  }

  const service = createServiceRoleClient();
  const { data: profile } = await service
    .from("users")
    .select("role")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile || !ADMIN_ROLES.includes(profile.role)) {
    return NextResponse.redirect(new URL("/login?error=wrong-app", base));
  }

  // Only owner can access Team (invites)
  if (request.nextUrl.pathname.startsWith("/team") && profile.role !== "owner") {
    return NextResponse.redirect(new URL("/", base));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
