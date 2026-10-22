"use client";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";

export default function Header() {
  const { locale, setLocale, t } = useI18n();

  return (
    <header className="bg-[#0B3C49] text-white shadow">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E3B23C] text-[#0B3C49] grid place-items-center font-black text-xl">S</div>
          <div>
            <h1 className="font-extrabold leading-none text-sm sm:text-base">{t.siteTitle}</h1>
            <p className="text-[11px] text-white/70 hidden sm:block">{t.siteSubtitle}</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="hidden sm:inline-flex items-center gap-1.5 bg-[#E3B23C] text-[#0B3C49] rounded-xl px-3 py-2 text-xs font-black hover:bg-[#d9a62e] transition"
          >
            🛡️ {locale === "ar" ? "لوحة المشرفة" : "Admin"}
          </Link>

          <label className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3 py-2">
            <span className="text-xs hidden sm:inline opacity-80">Language</span>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as "en" | "ar")}
              className="bg-transparent text-sm font-bold outline-none cursor-pointer"
              aria-label="Language switcher"
            >
              <option value="en" className="text-black">English</option>
              <option value="ar" className="text-black">العربية</option>
            </select>
          </label>

          <span className="hidden lg:inline-flex text-xs bg-white/10 border border-white/20 rounded-full px-3 py-1.5">{t.headerBadge}</span>
        </div>
      </div>
    </header>
  );
}
