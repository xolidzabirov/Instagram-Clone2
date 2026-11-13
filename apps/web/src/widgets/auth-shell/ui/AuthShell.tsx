"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { LOCALE_NAMES, LOCALES, useLocaleStore, useTranslations, type Locale } from "@/shared/i18n";
import { cn } from "@/shared/lib";

/** Bordered box of Instagram's auth pages; borderless on phones, like the real site */
export function AuthCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("w-full bg-background sm:border sm:border-separator", className)}>{children}</div>
  );
}

/** "ИЛИ" with lines on both sides */
export function AuthDivider() {
  const t = useTranslations("auth");
  return (
    <div className="my-4 flex w-full items-center gap-4" aria-hidden>
      <span className="h-px flex-1 bg-separator" />
      <span className="text-[13px] font-semibold text-muted">{t("or")}</span>
      <span className="h-px flex-1 bg-separator" />
    </div>
  );
}

const PHONE_SLIDES = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&h=900&fit=crop",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&h=900&fit=crop",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=500&h=900&fit=crop",
];

/** The phone next to the login form on wide screens, cycling through app screenshots */
export function PhoneShowcase() {
  return (
    <div aria-hidden className="relative mr-8 hidden h-[581px] w-[380px] shrink-0 lg:block">
      {/* back phone */}
      <div className="absolute left-0 top-0 h-[560px] w-[270px] rotate-[-4deg] rounded-[44px] border-[10px] border-[#1a1a1a] bg-[#1a1a1a] shadow-xl">
        <div className="relative size-full overflow-hidden rounded-[34px]">
          <Image src={PHONE_SLIDES[2]!} alt="" fill sizes="250px" className="object-cover opacity-70" />
        </div>
      </div>
      {/* front phone with the cross-fading screens */}
      <div className="absolute right-0 top-4 h-[560px] w-[270px] rounded-[44px] border-[10px] border-[#0f0f0f] bg-[#0f0f0f] shadow-2xl">
        <div className="absolute left-1/2 top-1.5 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-[#0f0f0f]" />
        <div className="relative size-full overflow-hidden rounded-[34px] bg-black">
          {PHONE_SLIDES.map((src, index) => (
            <Image
              key={src}
              src={src}
              alt=""
              fill
              sizes="250px"
              priority={index === 0}
              className="animate-phone-slide object-cover"
              style={{ animationDelay: `${index * 5}s`, opacity: index === 0 ? 1 : 0 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Links row, language picker and copyright under the auth pages */
export function AuthFooter() {
  const t = useTranslations("footer");
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);

  return (
    <footer className="flex flex-col items-center gap-3 px-4 pb-14 pt-6 text-xs text-muted">
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2">
        {t("links")
          .split("|")
          .map((label) => (
            <li key={label}>{label}</li>
          ))}
      </ul>
      <div className="flex items-center gap-4">
        <label className="relative">
          <span className="sr-only">Language</span>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="cursor-pointer appearance-none bg-transparent pr-4 text-muted outline-none focus-visible:underline"
          >
            {LOCALES.map((value) => (
              <option key={value} value={value} className="bg-background text-foreground">
                {LOCALE_NAMES[value]}
              </option>
            ))}
          </select>
          <span aria-hidden className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[10px]">
            ⌄
          </span>
        </label>
        <span>{t("copyright", { year: 2026 })}</span>
      </div>
    </footer>
  );
}
