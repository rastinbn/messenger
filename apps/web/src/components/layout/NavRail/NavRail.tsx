"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, MessageSquare, Search, Settings, Shield, Users, type LucideIcon } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { useCurrentUser } from "@/hooks/useUsers";
import { useNotifications } from "@/hooks/useNotifications";

const NAV_ITEMS: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/chat", label: "Chats", Icon: MessageSquare },
  { href: "/contacts", label: "Contacts", Icon: Users },
  { href: "/search", label: "Search", Icon: Search },
  { href: "/notifications", label: "Notifications", Icon: Bell }
];

export function NavRail() {
  const pathname = usePathname();
  const { data: user } = useCurrentUser();
  const { data: notifications } = useNotifications();
  const unreadNotifications = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <nav
      aria-label="Primary"
      className="hidden md:flex flex-col items-center justify-between w-16 shrink-0 bg-bg-surface border-r border-border-subtle py-4"
    >
      <div className="flex flex-col items-center gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative h-11 w-11 flex items-center justify-center rounded-[var(--radius-md)] transition-colors",
                isActive ? "bg-bg-elevated text-text-primary" : "text-text-muted hover:bg-bg-hover hover:text-text-primary"
              )}
            >
              <item.Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden />
              {item.href === "/notifications" && unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent-signal" />
              )}
            </Link>
          );
        })}

        {user?.siteRole === "admin" && (
          <Link
            href="/admin"
            aria-label="Admin panel"
            aria-current={pathname.startsWith("/admin") ? "page" : undefined}
            className={cn(
              "h-11 w-11 flex items-center justify-center rounded-[var(--radius-md)] transition-colors mt-1 border-t border-border-subtle pt-2",
              pathname.startsWith("/admin")
                ? "text-accent-signal"
                : "text-text-muted hover:bg-bg-hover hover:text-text-primary"
            )}
          >
            <Shield className="h-5 w-5" strokeWidth={1.8} aria-hidden />
          </Link>
        )}
      </div>

      <div className="flex flex-col items-center gap-3">
        <Link href="/settings" aria-label="Settings" className="text-text-muted hover:text-text-primary h-11 w-11 flex items-center justify-center rounded-[var(--radius-md)] hover:bg-bg-hover">
          <Settings className="h-5 w-5" strokeWidth={1.8} aria-hidden />
        </Link>
        <Link href="/profile/me" aria-label="Your profile">
          <Avatar name={user?.displayName ?? "You"} status={user?.status} size="sm" />
        </Link>
      </div>
    </nav>
  );
}
