import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const pathname = request.nextUrl.pathname;
  const isLoginRoute = pathname === "/login";
  const isAdminRoute =
    pathname === "/dashboard" ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/categories") ||
    pathname.startsWith("/collections") ||
    pathname.startsWith("/attributes") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/customers") ||
    pathname.startsWith("/edit-profile");

  // 1. Not logged in → send to login (protect admin routes)
  if (!user && isAdminRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 2. Logged in but hitting admin routes → check admin role
  if (user && isAdminRoute) {
    const { data: adminData } = await supabase
      .from("admins")
      .select("role")
      .eq("user_id", user.sub)
      .single();

    if (!adminData) {
      const url = request.nextUrl.clone();
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }

    // Attach role to a header so pages can read it without a second DB call
    supabaseResponse.headers.set("x-user-role", adminData.role);
  }

  return supabaseResponse;
}
