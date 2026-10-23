"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { useAdminStats } from "@/hooks/useAdmin";

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border-default bg-bg-surface p-5">
      <p className="text-xs text-text-muted uppercase tracking-wide mb-1">{label}</p>
      <p className="font-display text-3xl">{value}</p>
    </div>
  );
}

export default function AdminOverviewPage() {
  const { data: stats, isLoading } = useAdminStats();

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Total users" value={stats.totalUsers} />
          <StatCard label="New today" value={stats.newUsersToday} />
          <StatCard label="New this week" value={stats.newUsersThisWeek} />
          <StatCard label="Conversations" value={stats.totalConversations} />
          <StatCard label="Total messages" value={stats.totalMessages} />
          <StatCard label="Messages today" value={stats.messagesToday} />
          <StatCard label="Suspended users" value={stats.suspendedUsers} />
        </div>
      )}
    </div>
  );
}
