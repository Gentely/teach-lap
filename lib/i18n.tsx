"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { dictionary, Locale } from "./dictionary";

type Ctx = { locale: Locale; setLocale: (l: Locale) => void; t: typeof dictionary.en };
const I18nContext = createContext<Ctx>({ locale: "en", setLocale: () => {}, t: dictionary.en });

const STORAGE_KEY = "sabratha_locale";
const COOKIE_KEY = "sabratha_locale";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // الافتراضي إنجليزي كما هو مطلوب
  const [locale, setLocaleState] = useState<Locale>("en");

  // تحميل الاختيار المحفوظ عند بدء التشغيل
  useEffect(() => {
    try {
      const saved = (localStorage.getItem(STORAGE_KEY) as Locale) || (document.cookie.match(/(?:^|; )sabratha_locale=([^;]*)/)?.[1] as Locale);
      if (saved === "en" || saved === "ar") setLocaleState(saved);
    } catch {}
  }, []);

  // حفظ الاختيار في localStorage + Cookie + html lang/dir
  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
      document.cookie = `${COOKIE_KEY}=${l}; Path=/; Max-Age=31536000; SameSite=Lax`;
      document.documentElement.lang = l;
      document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    } catch {}
  };

  // تزامن خاصية dir/lang أول مرة
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const t = dictionary[locale];
  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() { return useContext(I18nContext); }
