"use client";

import { useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { useLogout, useResendVerificationEmail } from "@/hooks/useAuth";
import { useCurrentUser, useUpdateProfile, useUpdateStatus } from "@/hooks/useUsers";
import { useThemeStore } from "@/stores/useThemeStore";
import { useChatPrefsStore } from "@/stores/useChatPrefsStore";
import type { UserStatus } from "@messenger/shared-types";

const STATUS_OPTIONS: { value: UserStatus; label: string }[] = [
  { value: "online", label: "Online" },
  { value: "away", label: "Away" },
  { value: "dnd", label: "Do not disturb" },
  { value: "offline", label: "Appear offline" }
];

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-display text-base mb-3">{title}</h2>
      <div className="rounded-[var(--radius-lg)] border border-border-default bg-bg-surface divide-y divide-border-subtle">
        {children}
      </div>
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-4 px-4 py-3.5">{children}</div>;
}

function UnverifiedEmailBanner() {
  const resend = useResendVerificationEmail();
  const [sent, setSent] = useState(false);

  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-status-away/40 bg-status-away/10 px-4 py-3">
      <div>
        <p className="text-sm text-text-primary font-medium">Verify your email</p>
        <p className="text-xs text-text-secondary mt-0.5">
          {sent ? "Verification email sent — check your inbox." : "Confirm your email address to secure your account."}
        </p>
      </div>
      <Button
        size="sm"
        variant="secondary"
        isLoading={resend.isPending}
        disabled={sent}
        onClick={() => resend.mutate(undefined, { onSuccess: () => setSent(true) })}
      >
        {sent ? "Sent" : "Resend email"}
      </Button>
    </div>
  );
}

export default function SettingsPage() {
  const { data: user } = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const updateStatus = useUpdateStatus();
  const logout = useLogout();
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const keepLastMessageVisible = useChatPrefsStore((s) => s.keepLastMessageVisible);
  const setKeepLastMessageVisible = useChatPrefsStore((s) => s.setKeepLastMessageVisible);

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [statusMessage, setStatusMessage] = useState(user?.statusMessage ?? "");
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifMentions, setNotifMentions] = useState(true);
  const [notifSounds, setNotifSounds] = useState(false);

  if (!user) return null;

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="font-display text-2xl mb-6">Settings</h1>

        {"emailVerifiedAt" in user && !user.emailVerifiedAt && <UnverifiedEmailBanner />}

        <SettingsSection title="Profile">
          <div className="flex items-center gap-4 px-4 py-4">
            <Avatar name={displayName || user.displayName} size="lg" status={user.status} />
            <div className="flex-1 flex flex-col gap-3">
              <Input
                label="Display name"
                value={displayName || user.displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <Input
                label="Status message"
                placeholder="What's on your mind?"
                value={statusMessage || user.statusMessage || ""}
                onChange={(e) => setStatusMessage(e.target.value)}
              />
              <Button
                size="sm"
                className="self-start"
                isLoading={updateProfile.isPending}
                onClick={() =>
                  updateProfile.mutate({
                    displayName: displayName || user.displayName,
                    statusMessage: statusMessage || null
                  })
                }
              >
                Save changes
              </Button>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection title="Presence">
          {STATUS_OPTIONS.map((opt) => (
            <Row key={opt.value}>
              <span className="text-sm">{opt.label}</span>
              <input
                type="radio"
                name="status"
                checked={user.status === opt.value}
                onChange={() => updateStatus.mutate(opt.value)}
                aria-label={opt.label}
                className="accent-[var(--accent-signal)] h-4 w-4"
              />
            </Row>
          ))}
        </SettingsSection>

        <SettingsSection title="Appearance">
          <Row>
            <span className="text-sm">Dark mode</span>
            <Switch checked={theme === "dark"} onChange={toggleTheme} />
          </Row>
        </SettingsSection>

        <SettingsSection title="Chat">
          <Row>
            <div className="min-w-0">
              <p className="text-sm">Always show the newest message</p>
              <p className="text-xs text-text-secondary mt-0.5">
                Jump to the latest message whenever one arrives, even if you have scrolled up.
                When off, chats only follow along while you are already at the bottom.
              </p>
            </div>
            <Switch
              checked={keepLastMessageVisible}
              onChange={() => setKeepLastMessageVisible(!keepLastMessageVisible)}
              ariaLabel="Always show the newest message"
            />
          </Row>
        </SettingsSection>

        <SettingsSection title="Notifications">
          <Row>
            <span className="text-sm">New messages</span>
            <Switch checked={notifMessages} onChange={setNotifMessages} />
          </Row>
          <Row>
            <span className="text-sm">Mentions</span>
            <Switch checked={notifMentions} onChange={setNotifMentions} />
          </Row>
          <Row>
            <span className="text-sm">Notification sounds</span>
            <Switch checked={notifSounds} onChange={setNotifSounds} />
          </Row>
        </SettingsSection>

        <SettingsSection title="Account">
          <Row>
            <span className="text-sm">Log out of Messenger</span>
            <Button size="sm" variant="danger" isLoading={logout.isPending} onClick={() => logout.mutate()}>
              Log out
            </Button>
          </Row>
        </SettingsSection>
      </div>
    </main>
  );
}
