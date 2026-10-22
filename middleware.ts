import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = ["/login", "/auth", "/_next", "/favicon.ico"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname.match(/\.(png|jpg|svg|css|js|woff2?)$/)) {
    return NextResponse.next();
  }

  let res = NextResponse.next();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key-for-build";

  const supabase = createServerClient(url, key, {
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
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  const email = user.email.toLowerCase();
  const { data: allowed } = await supabase.from("allowed_users").select("email, role").eq("email", email).maybeSingle();

  if (!allowed) {
    await supabase.auth.signOut();
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("error", "not_allowed");
    redirectUrl.searchParams.set("email", email);
    return NextResponse.redirect(redirectUrl);
  }

  // حماية مسار المشرفة — فقط admin
  if (pathname.startsWith("/admin") && allowed.role !== "admin") {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.searchParams.set("error", "admin_only");
    return NextResponse.redirect(redirectUrl);
  }

  // حماية توليد Gemini — فقط teacher/admin، الطالب لا يستطيع استخدام Gemini
  if (pathname.startsWith("/api/generate") && allowed.role === "student") {
    return NextResponse.json({ success: false, error: { message: "Forbidden — students cannot use Gemini generation / الطلاب لا يمكنهم استخدام التوليد" } }, { status: 403 });
  }

  // حماية صفحات الأستاذ — فقط teacher/admin
  if ((pathname.startsWith("/teacher") || pathname.startsWith("/courses/new")) && allowed.role === "student") {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/student";
    redirectUrl.searchParams.set("error", "teacher_only");
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
