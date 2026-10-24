"use client";

import { RegisterInputSchema } from "@messenger/shared-types";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LanguageToggle, useLocale } from "@/components/providers/LocaleProvider";
import { useRegister } from "@/hooks/useAuth";
import type { RegisterInput } from "@messenger/shared-types";

export default function RegisterPage() {
  const registerUser = useRegister();
  const { t } = useLocale();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterInput>({ resolver: zodResolver(RegisterInputSchema) });

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-end mb-5"><LanguageToggle /></div>
        <h1 className="font-display text-2xl mb-1">{t("register.title")}</h1>
        <p className="text-text-secondary text-sm mb-6">{t("register.description")}</p>

        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit((data) => registerUser.mutate(data))}
          noValidate
        >
          <Input
            label={t("register.displayName")}
            placeholder="Ada Lovelace"
            error={errors.displayName?.message}
            {...register("displayName")}
          />
          <Input
            label={t("register.username")}
            placeholder="ada"
            error={errors.username?.message}
            {...register("username")}
          />
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
            autoComplete="new-password"
            placeholder={t("register.passwordHint")}
            error={errors.password?.message}
            {...register("password")}
          />

          {registerUser.isError && (
            <p role="alert" className="text-sm text-danger">
              {t("login.error")}
            </p>
          )}

          <Button type="submit" isLoading={registerUser.isPending} className="w-full mt-1">
            {t("register.submit")}
          </Button>
        </form>

        <p className="text-sm text-text-muted mt-6 text-center">
          {t("register.haveAccount")} {" "}
          <Link href="/login" className="text-accent-signal hover:underline">
            {t("landing.login")}
          </Link>
        </p>
      </div>
    </main>
  );
}
