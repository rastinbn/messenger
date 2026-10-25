"use client";

import { LoginInputSchema } from "@messenger/shared-types";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LanguageToggle, useLocale } from "@/components/providers/LocaleProvider";
import { useLogin, useRequestMagicLink } from "@/hooks/useAuth";
import type { LoginInput } from "@messenger/shared-types";

export default function LoginPage() {
  const login = useLogin();
  const { t } = useLocale();
  const [mode, setMode] = useState<"password" | "magic-link">("password");

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-end mb-5"><LanguageToggle /></div>
        <h1 className="font-display text-2xl mb-1">{t("login.title")}</h1>
        <p className="text-text-secondary text-sm mb-6">
          {mode === "password" ? t("login.description") : t("login.magicDescription")}
        </p>

        {mode === "password" ? <PasswordLoginForm login={login} /> : <MagicLinkForm />}

        <button
          type="button"
          className="text-sm text-accent-signal hover:underline mt-4 block mx-auto"
          onClick={() => setMode(mode === "password" ? "magic-link" : "password")}
        >
          {mode === "password" ? t("login.emailLink") : t("login.passwordInstead")}
        </button>

        <p className="text-sm text-text-muted mt-6 text-center">
          {t("login.newHere")} {" "}
          <Link href="/register" className="text-accent-signal hover:underline">
            {t("landing.createAccount")}
          </Link>
        </p>
      </div>
    </main>
  );
}

function PasswordLoginForm({ login }: { login: ReturnType<typeof useLogin> }) {
  const { t } = useLocale();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginInput>({ resolver: zodResolver(LoginInputSchema) });

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit((data) => login.mutate(data))} noValidate>
      <Input
        label={t("login.email")}
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        label={t("login.password")}
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        error={errors.password?.message}
        {...register("password")}
      />

      {login.isError && (
        <p role="alert" className="text-sm text-danger">
          {t("login.error")}
        </p>
      )}

      <Button type="submit" isLoading={login.isPending} className="w-full mt-1">
        {t("login.submit")}
      </Button>
    </form>
  );
}

function MagicLinkForm() {
  const { t } = useLocale();
  const requestMagicLink = useRequestMagicLink();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-text-secondary">
          {t("login.magicSent", { email })}
        </p>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        requestMagicLink.mutate(email, { onSuccess: () => setSent(true) });
      }}
      noValidate
    >
      <Input
        label={t("login.email")}
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Button type="submit" isLoading={requestMagicLink.isPending} className="w-full mt-1">
        {t("login.sendLink")}
      </Button>
    </form>
  );
}
