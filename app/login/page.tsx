import { Suspense } from "react";
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center bg-[#FBF8F3] p-4"><div className="text-sm text-slate-500">Loading…</div></div>}>
      <LoginClient />
    </Suspense>
  );
}
