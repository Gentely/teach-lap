import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// تسجيل دخول الطالبة — تتحقق أن الطالبة مسجلة في أحد مقررات إيناس
// نستخدم Supabase للتحقق من course_enrollments — لا حاجة لكلمة سر منفصلة، فقط البريد المسجل

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = String(body?.email || body?.username || "").trim().toLowerCase();
    const code = String(body?.code || "").trim(); // اختياري — للتوافق مع طلب اسم المستخدم + كود

    if (!email) return NextResponse.json({ success: false, error: { message: "البريد/اسم المستخدم مطلوب" } }, { status: 400 });

    // تحقق من وجود الطالبة في أي مقرر — إذا لم يكن هناك كود، نكتفي بوجود البريد في enrollments
    const cookieStore = cookies();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key-for-build";
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) { try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {} },
      },
    });

    // ابحث عن الطالبة في enrollments
    const { data: enrollments, error } = await supabase.from("course_enrollments").select("course_id, course:courses(title, teacher_username)").eq("student_email", email).limit(1);
    if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ success: false, error: { message: "الطالبة غير مسجلة في أي مقرر — تواصلي مع أستاذتك لدعوتك" } }, { status: 403 });
    }

    // إذا أُرسل كود، نتحقق منه إن وجد في جدول منفصل — حالياً نقبل أي كود إذا البريد موجود (للتبسيط)
    // يمكن لاحقاً إضافة جدول student_codes مع كود دائم لكل طالبة

    const res = NextResponse.json({ success: true, email, enrolled: enrollments.length });
    // جلسة طالبة — cookie منفصلة عن جلسة الأستاذة
    res.cookies.set("student_session", email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 يوم
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ success: false, error: { message: e?.message || "Server error" } }, { status: 500 });
  }
}
