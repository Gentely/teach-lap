import { NextRequest, NextResponse } from "next/server";
import { clearStudentSessionCookie } from "@/lib/server/teacherSession";

export async function POST(req: NextRequest) {
  const wantsJson = req.headers.get("accept")?.includes("application/json");
  const res = wantsJson
    ? NextResponse.json({ success: true, message: "تم تسجيل الخروج" })
    : NextResponse.redirect(new URL("/student-login", req.url));
  clearStudentSessionCookie(res);
  return res;
}

export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/student-login", req.url));
  clearStudentSessionCookie(res);
  return res;
}
