import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/role";

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx.user) return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  return NextResponse.json({
    success: true,
    data: {
      id: ctx.user.id,
      email: ctx.user.email,
      role: ctx.role,
      isAdmin: ctx.isAdmin,
      isTeacher: ctx.isTeacher,
      isStudent: ctx.isStudent,
    },
  });
}
