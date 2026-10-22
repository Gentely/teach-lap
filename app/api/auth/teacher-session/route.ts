import { NextRequest, NextResponse } from "next/server";
import { getTeacherFromRequest } from "@/lib/server/teacherSession";
import { getTeacherByUsername } from "@/lib/teachers";

export async function GET(req: NextRequest) {
  const username = getTeacherFromRequest(req);
  if (!username) return NextResponse.json({ success: false }, { status: 401 });
  const teacher = getTeacherByUsername(username);
  if (!teacher) return NextResponse.json({ success: false }, { status: 401 });
  return NextResponse.json({ success: true, username: teacher.username, displayName: teacher.displayNameAr, email: teacher.email });
}
