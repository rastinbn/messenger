"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useSession } from "@/hooks/useAuth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && session === null) {
      router.replace("/login");
    }
  }, [isLoading, session, router]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-dvh">
        <span className="h-6 w-6 rounded-full border-2 border-accent-signal border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  return <>{children}</>;
}
