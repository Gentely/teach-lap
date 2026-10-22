import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// المسارات العامة التي لا تحتاج حماية — ألغينا كود الدخول العام E-ENGLISH تماماً
const PUBLIC_PATHS = ["/login", "/auth", "/_next", "/favicon.ico"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // سماح للملفات الثابتة
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname.match(/\.(png|jpg|svg|css|js|woff2?)$/)) {
    return NextResponse.next();
  }

  let res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          req.cookies.set({ name, value, ...options });
          res = NextResponse.next({ request: { headers: req.headers } });
          res.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          req.cookies.set({ name, value: "", ...options });
          res = NextResponse.next({ request: { headers: req.headers } });
          res.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // 1) غير مسجل → إلى /login
  if (!user?.email) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // 2) مسجل لكن بريده ليس في allowed_users → تسجيل خروج + منع
  const email = user.email.toLowerCase();
  const { data: allowed } = await supabase
    .from("allowed_users")
    .select("email")
    .eq("email", email)
    .maybeSingle();

  if (!allowed) {
    await supabase.auth.signOut();
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "not_allowed");
    url.searchParams.set("email", email);
    return NextResponse.redirect(url);
  }

  // مسموح → متابعة
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
