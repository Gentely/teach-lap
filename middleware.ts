import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// المسارات العامة — لا تحتاج حماية (مهم: /api/auth يجب أن تبقى مفتوحة ليعمل تسجيل الدخول)
const PUBLIC_PATHS = ["/login", "/teacher-login", "/student-login", "/auth", "/api/auth", "/_next", "/favicon.ico"];

// للتحقق من جلسة الأستاذة — نسخة Edge-Compatible (Web Crypto لا تحتاج Node crypto)
function getTeacherSecret(): string {
  return process.env.TEACHER_SESSION_SECRET || "sabratha-teacher-secret-2025-dev-only";
}
async function hmacEdge(username: string): Promise<string> {
  const secret = getTeacherSecret();
  const keyData = new TextEncoder().encode(secret);
  const msg = new TextEncoder().encode(username.toLowerCase());
  // Edge + Node 18+ لديهما Web Crypto
  const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, msg);
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex.slice(0, 16);
}
async function verifyTeacherSession(value: string | undefined): Promise<string | null> {
  if (!value) return null;
  const [u, sig] = value.split(".");
  if (!u || !sig) return null;
  if (!["enas", "eman"].includes(u)) return null;
  const expected = await hmacEdge(u);
  if (expected !== sig) return null;
  return u;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // السماح للمسارات العامة والملفات الثابتة
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname.match(/\.(png|jpg|svg|css|js|woff2?)$/)) {
    return NextResponse.next();
  }

  // 1) تحقق من جلسة الأستاذة (Enas/Eman) — لها الأولوية الجديدة
  const teacherSessionVal = req.cookies.get("teacher_session")?.value;
  const teacherUser = await verifyTeacherSession(teacherSessionVal);
  if (teacherUser) {
    // الأستاذة مسجلة بدخول اسم المستخدم + كود — مسموح لها بكل شيء إلا مسارات الطالبات الخاصة
    // حماية توليد Gemini: مسموح للأستاذة فقط (وهذا متحقق لأنها أستاذة)
    // حماية /admin: مسموح لإيناس وإيمان (كلاهما admin ضمنياً)
    // لا حاجة لإعادة توجيه — اسمح
    // لكن امنع الأستاذة من دخول صفحات الطالبة الخاصة إن أرادت العزل الكامل (اختياري)
    return NextResponse.next();
  }

  // تحقق من جلسة الطالبة
  const studentSession = req.cookies.get("student_session")?.value;
  if (studentSession) {
    // الطالبة مسجلة — لا تسمح لها بتوليد Gemini أو دخول صفحات الأستاذة
    if (pathname.startsWith("/api/generate")) {
      return NextResponse.json({ success: false, error: { message: "Forbidden — students cannot use Gemini generation / الطالبات لا يمكنهن استخدام التوليد" } }, { status: 403 });
    }
    if (pathname.startsWith("/teacher") || pathname.startsWith("/admin")) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/student";
      redirectUrl.searchParams.set("error", "teacher_only");
      return NextResponse.redirect(redirectUrl);
    }
    // مسموح لها بـ /student و /courses/[id] و عرض المحاضرات
    return NextResponse.next();
  }

  // 2) لم يجد جلسة أستاذة/طالبة مخصصة — جرب Supabase القديم للتوافق (للأستاذات السابقات)
  let res = NextResponse.next();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key-for-build";

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          req.cookies.set({ name, value, ...options });
          // نحتاج تحديث res أيضاً ليُرسل Set-Cookie للمتصفح
          res.cookies.set({ name, value, ...options });
        });
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    // لم يسجل دخول بأي طريقة — وجه حسب المسار
    const redirectUrl = req.nextUrl.clone();
    if (pathname.startsWith("/teacher")) redirectUrl.pathname = "/teacher-login";
    else if (pathname.startsWith("/student") || pathname.startsWith("/courses")) redirectUrl.pathname = "/student-login";
    else redirectUrl.pathname = "/teacher-login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  const email = user.email.toLowerCase();
  const { data: allowed } = await supabase.from("allowed_users").select("email, role").eq("email", email).maybeSingle();

  if (!allowed) {
    await supabase.auth.signOut();
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/teacher-login";
    redirectUrl.searchParams.set("error", "not_allowed");
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname.startsWith("/admin") && allowed.role !== "admin") {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.searchParams.set("error", "admin_only");
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname.startsWith("/api/generate") && allowed.role === "student") {
    return NextResponse.json({ success: false, error: { message: "Forbidden — students cannot use Gemini generation" } }, { status: 403 });
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
