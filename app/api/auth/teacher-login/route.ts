import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials, createTeacherSessionValue } from "@/lib/server/teacherSession";
import { getTeacherByUsername } from "@/lib/teachers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const username = String(body?.username || "").trim();
    const code = String(body?.code || "").trim();

    if (!username || !code) {
      return NextResponse.json({ success: false, error: { message: "Username and code are required / اسم المستخدم والكود مطلوبان" } }, { status: 400 });
    }

    const teacher = getTeacherByUsername(username);
    if (!teacher) {
      return NextResponse.json({ success: false, error: { message: "Invalid username / اسم المستخدم غير صحيح" } }, { status: 401 });
    }

    const ok = verifyCredentials(username, code);
    if (!ok) {
      return NextResponse.json({ success: false, error: { message: "Invalid code / الكود غير صحيح" } }, { status: 401 });
    }

    // إنشاء جلسة موقعة
    const sessionValue = createTeacherSessionValue(teacher.username);
    const res = NextResponse.json({ success: true, username: teacher.username, displayName: teacher.displayNameAr, displayNameEn: teacher.displayName });
    res.cookies.set("teacher_session", sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 90, // 90 يوم
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ success: false, error: { message: e?.message || "Server error" } }, { status: 500 });
  }
}
