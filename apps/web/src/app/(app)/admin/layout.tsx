import Link from "next/link";

import { AdminGuard } from "@/components/layout/AdminGuard";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/conversations", label: "Conversations" }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-border-subtle px-6 py-4">
          <h1 className="font-display text-xl mb-3">Admin</h1>
          <nav className="flex gap-1">
            {TABS.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className="text-sm text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-[var(--radius-md)] hover:bg-bg-hover"
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </AdminGuard>
  );
}
