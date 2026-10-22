import { NextRequest, NextResponse } from "next/server";
import { clearTeacherSessionCookie } from "@/lib/server/teacherSession";

export async function POST(_req: NextRequest) {
  const res = NextResponse.json({ success: true });
  clearTeacherSessionCookie(res);
  return res;
}

export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/teacher-login", req.url));
  clearTeacherSessionCookie(res);
  return res;
}
