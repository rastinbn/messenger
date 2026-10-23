"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useCurrentUser } from "@/hooks/useUsers";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && user.siteRole !== "admin") {
      router.replace("/chat");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center h-dvh">
        <span className="h-6 w-6 rounded-full border-2 border-accent-signal border-t-transparent animate-spin" />
      </div>
    );
  }

  if (user.siteRole !== "admin") return null;

  return <>{children}</>;
}
