"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { useConsumeMagicLink } from "@/hooks/useAuth";

/**
 * `useSearchParams()` opts a route into client-side rendering, which Next
 * refuses to prerender unless it sits under a Suspense boundary. The default
 * export is the boundary; the actual page reads the token.
 */
export default function MagicLoginPage() {
  return (
    <Suspense fallback={null}>
      <MagicLoginContent />
    </Suspense>
  );
}

function MagicLoginContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const consume = useConsumeMagicLink();
  const [status, setStatus] = useState<"pending" | "error">("pending");
  const attempted = useRef(false);

  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;
    consume.mutate(token, {
      onError: () => setStatus("error")
    });
    // On success, useConsumeMagicLink redirects to /chat itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        {!token && (
          <>
            <h1 className="font-display text-2xl mb-2">Missing login link</h1>
            <p className="text-text-secondary text-sm">
              This page needs a token in the URL — use the link from your email.
            </p>
          </>
        )}

        {token && status === "pending" && (
          <>
            <span className="inline-block h-6 w-6 rounded-full border-2 border-accent-signal border-t-transparent animate-spin mb-3" />
            <p className="text-text-secondary text-sm">Logging you in…</p>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="font-display text-2xl mb-2">Link expired or already used</h1>
            <p className="text-text-secondary text-sm mb-6">
              Magic links only work once and expire after 15 minutes. Request a new one.
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
