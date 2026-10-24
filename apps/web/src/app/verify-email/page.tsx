"use client";

import { CircleCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { useConfirmEmailVerification } from "@/hooks/useAuth";

/**
 * `useSearchParams()` opts a route into client-side rendering, which Next
 * refuses to prerender unless it sits under a Suspense boundary.
 */
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const confirm = useConfirmEmailVerification();
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const attempted = useRef(false);

  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;
    confirm.mutate(token, {
      onSuccess: () => setStatus("success"),
      onError: () => setStatus("error")
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        {!token && (
          <>
            <h1 className="font-display text-2xl mb-2">Missing verification link</h1>
            <p className="text-text-secondary text-sm">
              This page needs a verification token in the URL — use the link from your email.
            </p>
          </>
        )}

        {token && status === "pending" && (
          <>
            <span className="inline-block h-6 w-6 rounded-full border-2 border-accent-signal border-t-transparent animate-spin mb-3" />
            <p className="text-text-secondary text-sm">Confirming your email…</p>
          </>
        )}

        {status === "success" && (
          <>
            <CircleCheck className="h-10 w-10 text-success mb-3" strokeWidth={1.6} aria-hidden />
            <h1 className="font-display text-2xl mb-2">Email confirmed</h1>
            <p className="text-text-secondary text-sm mb-6">Your email address is now verified.</p>
            <Link href="/chat">
              <Button>Go to Messenger</Button>
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="font-display text-2xl mb-2">Link expired or invalid</h1>
            <p className="text-text-secondary text-sm mb-6">
              This verification link is no longer valid. You can request a new one from Settings
              after logging in.
            </p>
            <Link href="/login">
              <Button variant="secondary">Back to login</Button>
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
