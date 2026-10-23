"use client";

import { LoginInputSchema } from "@messenger/shared-types";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLogin, useRequestMagicLink } from "@/hooks/useAuth";
import type { LoginInput } from "@messenger/shared-types";

export default function LoginPage() {
  const login = useLogin();
  const [mode, setMode] = useState<"password" | "magic-link">("password");

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl mb-1">Welcome back</h1>
        <p className="text-text-secondary text-sm mb-6">
          {mode === "password" ? "Log in to keep your conversations going." : "We'll email you a one-time login link."}
        </p>

        {mode === "password" ? <PasswordLoginForm login={login} /> : <MagicLinkForm />}

        <button
          type="button"
          className="text-sm text-accent-signal hover:underline mt-4 block mx-auto"
          onClick={() => setMode(mode === "password" ? "magic-link" : "password")}
        >
          {mode === "password" ? "Email me a login link instead" : "Log in with a password instead"}
        </button>

        <p className="text-sm text-text-muted mt-6 text-center">
          New here?{" "}
          <Link href="/register" className="text-accent-signal hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}

function PasswordLoginForm({ login }: { login: ReturnType<typeof useLogin> }) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginInput>({ resolver: zodResolver(LoginInputSchema) });

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit((data) => login.mutate(data))} noValidate>
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        error={errors.password?.message}
        {...register("password")}
      />

      {login.isError && (
        <p role="alert" className="text-sm text-danger">
          Something went wrong. Please try again.
        </p>
      )}

      <Button type="submit" isLoading={login.isPending} className="w-full mt-1">
        Log in
      </Button>
    </form>
  );
}

function MagicLinkForm() {
  const requestMagicLink = useRequestMagicLink();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-text-secondary">
          If an account exists for <span className="text-text-primary">{email}</span>, a login link
          is on its way. Check your inbox.
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
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Button type="submit" isLoading={requestMagicLink.isPending} className="w-full mt-1">
        Send login link
      </Button>
    </form>
  );
}
