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
import { LanguageToggle, useLocale } from "@/components/providers/LocaleProvider";
import type { MessageKey } from "@/components/providers/LocaleProvider";

const STATUS_OPTIONS: { value: UserStatus; label: MessageKey }[] = [
  { value: "online", label: "settings.online" },
  { value: "away", label: "settings.away" },
  { value: "dnd", label: "settings.dnd" },
  { value: "offline", label: "settings.offline" }
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
  const { t } = useLocale();
  const resend = useResendVerificationEmail();
  const [sent, setSent] = useState(false);

  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-status-away/40 bg-status-away/10 px-4 py-3">
      <div>
        <p className="text-sm text-text-primary font-medium">{t("settings.verifyEmail")}</p>
        <p className="text-xs text-text-secondary mt-0.5">
          {sent ? t("settings.emailSent") : t("settings.verifyHelp")}
        </p>
      </div>
      <Button
        size="sm"
        variant="secondary"
        isLoading={resend.isPending}
        disabled={sent}
        onClick={() => resend.mutate(undefined, { onSuccess: () => setSent(true) })}
      >
        {sent ? t("settings.sent") : t("settings.resend")}
      </Button>
    </div>
  );
}

export default function SettingsPage() {
  const { t } = useLocale();
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
        <h1 className="font-display text-2xl mb-6">{t("settings.title")}</h1>

        {"emailVerifiedAt" in user && !user.emailVerifiedAt && <UnverifiedEmailBanner />}

        <SettingsSection title={t("settings.profile")}>
          <div className="flex items-center gap-4 px-4 py-4">
            <Avatar name={displayName || user.displayName} size="lg" status={user.status} />
            <div className="flex-1 flex flex-col gap-3">
              <Input
                label={t("register.displayName")}
                value={displayName || user.displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <Input
                label={t("settings.statusMessage")}
                placeholder={t("settings.statusPlaceholder")}
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
                {t("settings.save")}
              </Button>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection title={t("settings.presence")}>
          {STATUS_OPTIONS.map((opt) => (
            <Row key={opt.value}>
              <span className="text-sm">{t(opt.label)}</span>
              <input
                type="radio"
                name="status"
                checked={user.status === opt.value}
                onChange={() => updateStatus.mutate(opt.value)}
                aria-label={t(opt.label)}
                className="accent-[var(--accent-signal)] h-4 w-4"
              />
            </Row>
          ))}
        </SettingsSection>

        <SettingsSection title={t("settings.appearance")}>
          <Row>
            <span className="text-sm">{t("settings.darkMode")}</span>
            <Switch checked={theme === "dark"} onChange={toggleTheme} />
          </Row>
          <Row>
            <span className="text-sm">{t("settings.language")}</span>
            <LanguageToggle />
          </Row>
        </SettingsSection>

        <SettingsSection title={t("settings.chat")}>
          <Row>
            <div className="min-w-0">
              <p className="text-sm">{t("settings.latestMessage")}</p>
              <p className="text-xs text-text-secondary mt-0.5">
                {t("settings.latestMessageHelp")}
              </p>
            </div>
            <Switch
              checked={keepLastMessageVisible}
              onChange={() => setKeepLastMessageVisible(!keepLastMessageVisible)}
              ariaLabel={t("settings.latestMessage")}
            />
          </Row>
        </SettingsSection>

        <SettingsSection title={t("settings.notifications")}>
          <Row>
            <span className="text-sm">{t("settings.newMessages")}</span>
            <Switch checked={notifMessages} onChange={setNotifMessages} />
          </Row>
          <Row>
            <span className="text-sm">{t("settings.mentions")}</span>
            <Switch checked={notifMentions} onChange={setNotifMentions} />
          </Row>
          <Row>
            <span className="text-sm">{t("settings.notificationSounds")}</span>
            <Switch checked={notifSounds} onChange={setNotifSounds} />
          </Row>
        </SettingsSection>

        <SettingsSection title={t("settings.account")}>
          <Row>
            <span className="text-sm">{t("settings.logoutMessenger")}</span>
            <Button size="sm" variant="danger" isLoading={logout.isPending} onClick={() => logout.mutate()}>
              {t("settings.logout")}
            </Button>
          </Row>
        </SettingsSection>
      </div>
    </main>
  );
}
