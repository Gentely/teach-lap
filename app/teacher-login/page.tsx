import TeacherLoginClient from "./TeacherLoginClient";
import { Suspense } from "react";

export const dynamic = "force-dynamic";
export const metadata = { title: "دخول الأستاذة — Teacher Login" };

export default function TeacherLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center bg-[#FBF8F3] p-4"><div className="text-sm text-slate-500">Loading…</div></div>}>
      <TeacherLoginClient />
    </Suspense>
  );
}
