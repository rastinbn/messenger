"use client";

import { RegisterInputSchema } from "@messenger/shared-types";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useRegister } from "@/hooks/useAuth";
import type { RegisterInput } from "@messenger/shared-types";

export default function RegisterPage() {
  const registerUser = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterInput>({ resolver: zodResolver(RegisterInputSchema) });

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl mb-1">Create your account</h1>
        <p className="text-text-secondary text-sm mb-6">Takes about a minute.</p>

        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit((data) => registerUser.mutate(data))}
          noValidate
        >
          <Input
            label="Display name"
            placeholder="Ada Lovelace"
            error={errors.displayName?.message}
            {...register("displayName")}
          />
          <Input
            label="Username"
            placeholder="ada"
            error={errors.username?.message}
            {...register("username")}
          />
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
            autoComplete="new-password"
            placeholder="At least 8 characters"
            error={errors.password?.message}
            {...register("password")}
          />

          {registerUser.isError && (
            <p role="alert" className="text-sm text-danger">
              Something went wrong. Please try again.
            </p>
          )}

          <Button type="submit" isLoading={registerUser.isPending} className="w-full mt-1">
            Create account
          </Button>
        </form>

        <p className="text-sm text-text-muted mt-6 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-accent-signal hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
