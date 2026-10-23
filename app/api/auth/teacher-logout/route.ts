import { NextRequest, NextResponse } from "next/server";
import { clearTeacherSessionCookie } from "@/lib/server/teacherSession";

export async function POST(req: NextRequest) {
  // دعم إعادة التوجيه بعد POST من نموذج أو من fetch
  const wantsJson = req.headers.get("accept")?.includes("application/json");
  const res = wantsJson
    ? NextResponse.json({ success: true, message: "تم تسجيل الخروج" })
    : NextResponse.redirect(new URL("/teacher-login", req.url));
  clearTeacherSessionCookie(res);
  return res;
}

export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/teacher-login", req.url));
  clearTeacherSessionCookie(res);
  return res;
}
