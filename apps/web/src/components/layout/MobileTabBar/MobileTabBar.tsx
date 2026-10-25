"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, MessageSquare, Search, Settings, Shield, Users, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";
import { useNotifications } from "@/hooks/useNotifications";
import { useCurrentUser } from "@/hooks/useUsers";
import { useLocale } from "@/components/providers/LocaleProvider";

const BASE_TABS: { href: string; label: "nav.chats" | "nav.contacts" | "nav.search" | "nav.alerts" | "nav.settings" | "nav.admin"; Icon: LucideIcon }[] = [
  { href: "/chat", label: "nav.chats", Icon: MessageSquare },
  { href: "/contacts", label: "nav.contacts", Icon: Users },
  { href: "/search", label: "nav.search", Icon: Search },
  { href: "/notifications", label: "nav.alerts", Icon: Bell },
  { href: "/settings", label: "nav.settings", Icon: Settings }
];

export function MobileTabBar() {
  const { t } = useLocale();
  const pathname = usePathname();
  const { data: notifications } = useNotifications();
  const { data: user } = useCurrentUser();
  const unread = notifications?.filter((n) => !n.read).length ?? 0;

  const tabs =
    user?.siteRole === "admin"
      ? [...BASE_TABS, { href: "/admin", label: "nav.admin", Icon: Shield }]
      : BASE_TABS;

  return (
    <nav
      aria-label={t("nav.primary")}
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-stretch justify-around bg-bg-surface border-t border-border-subtle h-14 overflow-x-auto"
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative flex-1 min-w-[56px] flex flex-col items-center justify-center gap-0.5 text-[10px]",
              isActive ? "text-text-primary" : "text-text-muted"
            )}
          >
            <tab.Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden />
            {t(tab.label)}
            {tab.href === "/notifications" && unread > 0 && (
              <span className="absolute top-1.5 right-[28%] h-1.5 w-1.5 rounded-full bg-accent-signal" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
