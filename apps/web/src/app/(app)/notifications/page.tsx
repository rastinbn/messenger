"use client";

import { AtSign, Hand, Info, MessageSquare, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/cn";
import { formatRelativeDay } from "@/lib/formatTime";
import { useLocale } from "@/components/providers/LocaleProvider";

const ICONS: Record<string, LucideIcon> = {
  message: MessageSquare,
  mention: AtSign,
  friend_request: Hand,
  system: Info
};

export default function NotificationsPage() {
  const { t } = useLocale();
  const { data: notifications, isLoading } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  const markRead = useMarkNotificationRead();

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl mb-1">{t("nav.notifications")}</h1>
            <p className="text-text-secondary text-sm">{t("notifications.description")}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => markAllRead.mutate()}>
            {t("notifications.markAll")}
          </Button>
        </div>

        {isLoading && (
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}

        {!isLoading && notifications?.length === 0 && (
          <p className="text-sm text-text-muted text-center mt-10">{t("notifications.empty")}</p>
        )}

        <ul className="flex flex-col divide-y divide-border-subtle">
          {notifications?.map((n) => {
            const content = (
              <div
                className={cn(
                  "flex items-start gap-3 py-3.5 px-2 -mx-2 rounded-[var(--radius-md)]",
                  !n.read && "bg-bg-elevated"
                )}
              >
                <span className="shrink-0 mt-0.5 text-text-muted" aria-hidden>
                  {(() => {
                    const Icon = ICONS[n.type] ?? Info;
                    return <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />;
                  })()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{n.title}</span>{" "}
                    <span className="text-text-secondary">{n.body}</span>
                  </p>
                  <p className="text-xs text-text-muted font-mono mt-0.5">{formatRelativeDay(n.createdAt)}</p>
                </div>
                {!n.read && <span className="h-2 w-2 rounded-full bg-accent-signal mt-1.5 shrink-0" />}
              </div>
            );

            return (
              <li key={n.id}>
                {n.relatedConversationId ? (
                  <Link href={`/chat/${n.relatedConversationId}`} onClick={() => markRead.mutate(n.id)}>
                    {content}
                  </Link>
                ) : (
                  <button className="w-full text-left" onClick={() => markRead.mutate(n.id)}>
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
