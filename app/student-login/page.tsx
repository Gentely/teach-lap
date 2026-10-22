import StudentLoginClient from "./StudentLoginClient";
import { Suspense } from "react";
export const dynamic = "force-dynamic";
export default function StudentLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center">Loading…</div>}>
      <StudentLoginClient />
    </Suspense>
  );
}
