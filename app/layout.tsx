import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import Header from "@/components/Header";

export const metadata = { title: "SABRATHA ELT Tech-Assistant", description: "Employing Technology in ELT — Sabratha University", other: { "color-scheme": "light" } };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // الافتراضي إنجليزي — i18n يضبط dir/lang عبر الجافاسكربت + الكوكي
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className="bg-[#FBF8F3] text-slate-800 antialiased min-h-screen flex flex-col">
        <I18nProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <footer dir="auto" className="bg-[#0B3C49] text-white/70 py-6 px-4 text-center text-xs">
            <span className="block max-w-3xl mx-auto break-words">© 2026 Sabratha University — Faculty of Arts & Education — English Department</span>
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}
