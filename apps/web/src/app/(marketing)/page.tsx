"use client";

import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { LanguageToggle, useLocale } from "@/components/providers/LocaleProvider";

const FEATURES = [
  { title: "landing.feature1.title", body: "landing.feature1.body" },
  { title: "landing.feature2.title", body: "landing.feature2.body" },
  { title: "landing.feature3.title", body: "landing.feature3.body" }
] as const;

export default function LandingPage() {
  const { t } = useLocale();

  return (
    <main className="flex-1 flex flex-col">
      <header className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-border-subtle">
        <span className="font-display text-lg font-semibold">Messenger</span>
        <nav className="flex items-center gap-2 md:gap-3">
          <LanguageToggle />
          <Link href="/login" className="text-sm text-text-secondary hover:text-text-primary px-3 py-2">
            {t("landing.login")}
          </Link>
          <Link href="/register">
            <Button size="sm">{t("landing.getStarted")}</Button>
          </Link>
        </nav>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 md:py-32">
        <h1 className="font-display text-4xl md:text-6xl font-semibold max-w-2xl text-balance">
          {t("landing.title")}
        </h1>
        <p className="text-text-secondary text-lg max-w-xl mt-5 text-balance">
          {t("landing.description")}
        </p>
        <div className="flex items-center gap-3 mt-8">
          <Link href="/register">
            <Button size="lg">{t("landing.createAccount")}</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="secondary">
              {t("landing.login")}
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-px bg-border-subtle border-y border-border-subtle">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="bg-bg-base px-8 py-10">
            <h2 className="font-display text-lg mb-2">{t(feature.title)}</h2>
            <p className="text-sm text-text-secondary leading-relaxed">{t(feature.body)}</p>
          </div>
        ))}
      </section>

      <footer className="px-6 md:px-10 py-6 text-xs text-text-muted flex items-center justify-between">
        <span>{t("landing.copyright")}</span>
        <a
          href="https://github.com"
          className="hover:text-text-primary"
          target="_blank"
          rel="noreferrer"
        >
          {t("landing.source")}
        </a>
      </footer>
    </main>
  );
}
