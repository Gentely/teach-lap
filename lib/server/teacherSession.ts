import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getTeacherByUsername, TEACHERS } from "@/lib/teachers";

const COOKIE_NAME = "teacher_session";
// استخدم متغير بيئة للتوقيع، أو fallback ثابت للتطوير — في الإنتاج ضعه في Vercel
const SECRET = process.env.TEACHER_SESSION_SECRET || "sabratha-teacher-secret-2025-dev-only";

function hmac(username: string): string {
  return crypto.createHmac("sha256", SECRET).update(username.toLowerCase()).digest("hex").slice(0, 16);
}

export function createTeacherSessionValue(username: string): string {
  const u = username.trim().toLowerCase();
  return `${u}.${hmac(u)}`;
}

export function verifyTeacherSessionValue(value: string | undefined | null): string | null {
  if (!value) return null;
  const [u, sig] = value.split(".");
  if (!u || !sig) return null;
  if (hmac(u) !== sig) return null;
  const teacher = getTeacherByUsername(u);
  if (!teacher) return null;
  return teacher.username; // يعيد الاسم الأصلي بحالته الصحيحة
}

export function getTeacherFromCookies(): string | null {
  try {
    const cookieStore = cookies();
    const val = cookieStore.get(COOKIE_NAME)?.value;
    return verifyTeacherSessionValue(val);
  } catch {
    return null;
  }
}

export function getTeacherFromRequest(req: NextRequest): string | null {
  const val = req.cookies.get(COOKIE_NAME)?.value;
  return verifyTeacherSessionValue(val);
}

export function setTeacherSessionCookie(res: NextResponse, username: string) {
  const val = createTeacherSessionValue(username);
  res.cookies.set(COOKIE_NAME, val, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90, // 90 يوم — كود دائم
  });
}

export function clearTeacherSessionCookie(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export function verifyCredentials(username: string, code: string): boolean {
  const teacher = getTeacherByUsername(username);
  if (!teacher) return false;
  // مقارنة مباشرة — الكود ثابت كما أعطته المستخدمة
  return teacher.code === code.trim();
}

// للاستخدام في API Routes التي تحتاج معرفة الأستاذ الحالي
export function getTeacherFromRequestWithDetails(req: NextRequest) {
  const username = getTeacherFromRequest(req);
  if (!username) return null;
  const teacher = getTeacherByUsername(username);
  return teacher;
}
