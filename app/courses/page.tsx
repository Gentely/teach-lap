import { getAuthContext } from "@/lib/server/role";
import CoursesClient from "./CoursesClient";
import Link from "next/link";

export default async function CoursesPage() {
  const ctx = await getAuthContext();
  if (!ctx.user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="font-black text-[#0B3C49]">Please sign in</h1>
        <Link href="/login" className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-[#0F4C5C] text-white font-bold">Go to Login</Link>
      </div>
    );
  }
  return <CoursesClient initialRole={ctx.role} currentEmail={ctx.user.email} />;
}
