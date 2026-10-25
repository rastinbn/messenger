"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const messages = {
  en: {
    "language.switch": "Switch to Persian",
    "landing.login": "Log in",
    "landing.getStarted": "Get started",
    "landing.title": "A calm place for conversations that never stop.",
    "landing.description": "An open-source messenger for people who run a lot of threads at once — fast, legible, and yours to run anywhere.",
    "landing.createAccount": "Create an account",
    "landing.feature1.title": "Real conversations, calmly organized",
    "landing.feature1.body": "Unread state lives in a single thin stroke, not a wall of badges — so a busy inbox still reads at a glance.",
    "landing.feature2.title": "Built for groups and DMs alike",
    "landing.feature2.body": "Direct messages and group chats share one fast, consistent interface — no mode-switching.",
    "landing.feature3.title": "Open source, end to end",
    "landing.feature3.body": "Full source, MIT licensed. Self-host it, fork it, or just read how it's built.",
    "landing.copyright": "© 2026 Messenger — MIT Licensed",
    "landing.source": "View source",
    "login.title": "Welcome back",
    "login.description": "Log in to keep your conversations going.",
    "login.magicDescription": "We'll email you a one-time login link.",
    "login.emailLink": "Email me a login link instead",
    "login.passwordInstead": "Log in with a password instead",
    "login.newHere": "New here?",
    "login.email": "Email",
    "login.password": "Password",
    "login.error": "Something went wrong. Please try again.",
    "login.submit": "Log in",
    "login.magicSent": "If an account exists for {email}, a login link is on its way. Check your inbox.",
    "login.sendLink": "Send login link",
    "register.title": "Create your account",
    "register.description": "Takes about a minute.",
    "register.displayName": "Display name",
    "register.username": "Username",
    "register.passwordHint": "At least 8 characters",
    "register.submit": "Create account",
    "register.haveAccount": "Already have an account?",
    "common.cancel": "Cancel",
    "common.backToLogin": "Back to login",
    "common.loading": "Loading…",
    "common.message": "Message",
    "common.remove": "Remove",
    "common.add": "Add",
    "nav.chats": "Chats",
    "nav.contacts": "Contacts",
    "nav.search": "Search",
    "nav.notifications": "Notifications",
    "nav.alerts": "Alerts",
    "nav.settings": "Settings",
    "nav.admin": "Admin",
    "nav.primary": "Primary",
    "nav.adminPanel": "Admin panel",
    "nav.profile": "Your profile",
    "chat.searchConversations": "Search conversations",
    "chat.newGroup": "New group",
    "chat.noConversations": "No conversations found.",
    "chat.selectConversation": "Select a conversation to start chatting.",
    "chat.you": "You",
    "chat.unknown": "Unknown",
    "contacts.description": "People you can message directly.",
    "contacts.search": "Search contacts",
    "contacts.empty": "No contacts found.",
    "search.description": "Find people by name or username.",
    "search.placeholder": "Search by name or @username",
    "search.people": "Search users",
    "search.empty": "No people found for “{query}”.",
    "notifications.description": "Mentions, messages, and account activity.",
    "notifications.markAll": "Mark all read",
    "notifications.empty": "You're all caught up.",
    "settings.title": "Settings",
    "settings.profile": "Profile",
    "settings.statusMessage": "Status message",
    "settings.statusPlaceholder": "What's on your mind?",
    "settings.save": "Save changes",
    "settings.presence": "Presence",
    "settings.online": "Online",
    "settings.away": "Away",
    "settings.dnd": "Do not disturb",
    "settings.offline": "Appear offline",
    "settings.appearance": "Appearance",
    "settings.darkMode": "Dark mode",
    "settings.chat": "Chat",
    "settings.latestMessage": "Always show the newest message",
    "settings.latestMessageHelp": "Jump to the latest message whenever one arrives, even if you have scrolled up. When off, chats only follow along while you are already at the bottom.",
    "settings.notifications": "Notifications",
    "settings.newMessages": "New messages",
    "settings.mentions": "Mentions",
    "settings.notificationSounds": "Notification sounds",
    "settings.account": "Account",
    "settings.logoutMessenger": "Log out of Messenger",
    "settings.logout": "Log out",
    "settings.language": "Language",
    "settings.verifyEmail": "Verify your email",
    "settings.verifyHelp": "Confirm your email address to secure your account.",
    "settings.emailSent": "Verification email sent — check your inbox.",
    "settings.sent": "Sent",
    "settings.resend": "Resend email",
    "group.title": "New group",
    "group.name": "Group name",
    "group.namePlaceholder": "e.g. Launch Squad",
    "group.addPeople": "Add people",
    "group.selected": "{count} selected",
    "group.loadingContacts": "Loading contacts…",
    "group.noContacts": "No contacts yet — add some from Search first.",
    "group.onePersonHelp": "With just one person, add a group name or select one more person.",
    "group.create": "Create group",
    "message.deleteTitle": "Delete message?",
    "message.deleteHelp": "This message will be deleted for everyone in this conversation. This cannot be undone.",
    "message.delete": "Delete",
    "theme.title": "Theme",
    "theme.graphite": "Graphite",
    "theme.neon": "Neon",
    "theme.aurora": "Aurora",
    "theme.cyber": "Cyber",
    "theme.sunset": "Sunset",
    "theme.candy": "Candy",
    "chat.background": "Chat background",
    "chat.backgroundHint": "Applies to this conversation on this device.",
    "chat.backgroundDefault": "Theme default",
    "chat.backgroundDots": "Dots",
    "chat.backgroundGrid": "Grid",
    "chat.backgroundWaves": "Waves",
    "chat.backgroundSunset": "Sunset",
    "chat.backgroundOcean": "Ocean",
    "chat.backgroundForest": "Forest",
    "chat.backgroundDusk": "Dusk",
    "error.title": "Something went wrong",
    "error.notFound": "Page not found",
    "error.backHome": "Back to home",
  },
  fa: {
    "language.switch": "Switch to English",
    "landing.login": "ورود",
    "landing.getStarted": "شروع کنید",
    "landing.title": "جایی آرام برای گفت‌وگوهایی که ادامه دارند.",
    "landing.description": "پیام‌رسان متن‌باز برای کسانی که چندین گفت‌وگو را هم‌زمان پیش می‌برند؛ سریع، خوانا و قابل‌اجرا روی سرور خودتان.",
    "landing.createAccount": "ساخت حساب کاربری",
    "landing.feature1.title": "گفت‌وگوها، مرتب و بی‌دردسر",
    "landing.feature1.body": "پیام‌های خوانده‌نشده با یک نشانه‌ی ساده مشخص می‌شوند، نه انبوهی از اعلان‌ها؛ تا صندوق شلوغ هم در یک نگاه خوانا بماند.",
    "landing.feature2.title": "برای گفت‌وگوی دونفره و گروهی",
    "landing.feature2.body": "گفت‌وگوهای خصوصی و گروهی در یک رابط سریع و یکدست کنار هم هستند؛ بدون جابه‌جایی بین حالت‌های مختلف.",
    "landing.feature3.title": "متن‌باز، از ابتدا تا انتها",
    "landing.feature3.body": "کد کامل با مجوز MIT منتشر شده؛ می‌توانید خودتان میزبانی‌اش کنید، نسخه‌ای جدا بسازید یا فقط کدش را ببینید.",
    "landing.copyright": "© ۲۰۲۶ مسنجر — منتشرشده با مجوز MIT",
    "landing.source": "مشاهده‌ی کد منبع",
    "login.title": "خوش برگشتی",
    "login.description": "وارد شو و گفت‌وگوهایت را ادامه بده.",
    "login.magicDescription": "لینک یک‌بارمصرف ورود را برایت ایمیل می‌کنیم.",
    "login.emailLink": "به‌جایش لینک ورود برایم ایمیل کن",
    "login.passwordInstead": "به‌جایش با گذرواژه وارد می‌شوم",
    "login.newHere": "تازه به مسنجر آمده‌ای؟",
    "login.email": "ایمیل",
    "login.password": "گذرواژه",
    "login.error": "مشکلی پیش آمد. دوباره تلاش کن.",
    "login.submit": "ورود",
    "login.magicSent": "اگر حسابی با ایمیل {email} وجود داشته باشد، لینک ورود برایت فرستاده می‌شود. صندوق ورودی‌ات را بررسی کن.",
    "login.sendLink": "فرستادن لینک ورود",
    "register.title": "ساخت حساب کاربری",
    "register.description": "حدود یک دقیقه زمان می‌برد.",
    "register.displayName": "نام نمایشی",
    "register.username": "نام کاربری",
    "register.passwordHint": "حداقل ۸ نویسه",
    "register.submit": "ساخت حساب",
    "register.haveAccount": "از قبل حساب داری؟",
    "common.cancel": "لغو",
    "common.backToLogin": "بازگشت به ورود",
    "common.loading": "در حال بارگذاری…",
    "common.message": "پیام دادن",
    "common.remove": "حذف",
    "common.add": "افزودن",
    "nav.chats": "گفت‌وگوها",
    "nav.contacts": "مخاطبان",
    "nav.search": "جست‌وجو",
    "nav.notifications": "اعلان‌ها",
    "nav.alerts": "اعلان‌ها",
    "nav.settings": "تنظیمات",
    "nav.admin": "مدیریت",
    "nav.primary": "ناوبری اصلی",
    "nav.adminPanel": "پنل مدیریت",
    "nav.profile": "نمایه‌ی شما",
    "chat.searchConversations": "جست‌وجو در گفت‌وگوها",
    "chat.newGroup": "گروه جدید",
    "chat.noConversations": "گفت‌وگویی پیدا نشد.",
    "chat.selectConversation": "برای شروع، یک گفت‌وگو انتخاب کن.",
    "chat.you": "خودت",
    "chat.unknown": "نامشخص",
    "contacts.description": "افرادی که می‌توانی مستقیم به آن‌ها پیام بدهی.",
    "contacts.search": "جست‌وجوی مخاطبان",
    "contacts.empty": "مخاطبی پیدا نشد.",
    "search.description": "افراد را با نام یا نام کاربری پیدا کن.",
    "search.placeholder": "جست‌وجو با نام یا @نام‌کاربری",
    "search.people": "جست‌وجوی کاربران",
    "search.empty": "کسی با عبارت «{query}» پیدا نشد.",
    "notifications.description": "اشاره‌ها، پیام‌ها و فعالیت‌های حساب.",
    "notifications.markAll": "خواندن همه",
    "notifications.empty": "همه‌ی اعلان‌ها را دیدی.",
    "settings.title": "تنظیمات",
    "settings.profile": "نمایه",
    "settings.statusMessage": "پیام وضعیت",
    "settings.statusPlaceholder": "چه خبر؟",
    "settings.save": "ذخیره‌ی تغییرات",
    "settings.presence": "وضعیت حضور",
    "settings.online": "آنلاین",
    "settings.away": "دوردسترس نیستم",
    "settings.dnd": "مزاحم نشوید",
    "settings.offline": "نمایش به‌صورت آفلاین",
    "settings.appearance": "نمایش",
    "settings.darkMode": "حالت تاریک",
    "settings.chat": "گفت‌وگو",
    "settings.latestMessage": "همیشه تازه‌ترین پیام را نشان بده",
    "settings.latestMessageHelp": "با رسیدن پیام تازه، حتی اگر به بالای گفت‌وگو رفته باشی، به آخرین پیام برو. اگر خاموش باشد، فقط وقتی در انتهای گفت‌وگو هستی پیام‌ها دنبال می‌شوند.",
    "settings.notifications": "اعلان‌ها",
    "settings.newMessages": "پیام‌های تازه",
    "settings.mentions": "اشاره‌ها",
    "settings.notificationSounds": "صدای اعلان‌ها",
    "settings.account": "حساب کاربری",
    "settings.logoutMessenger": "خروج از مسنجر",
    "settings.logout": "خروج",
    "settings.language": "زبان",
    "settings.verifyEmail": "تأیید ایمیل",
    "settings.verifyHelp": "برای امن‌تر شدن حساب، نشانی ایمیلت را تأیید کن.",
    "settings.emailSent": "ایمیل تأیید فرستاده شد؛ صندوق ورودی‌ات را بررسی کن.",
    "settings.sent": "فرستاده شد",
    "settings.resend": "ارسال دوباره‌ی ایمیل",
    "group.title": "گروه جدید",
    "group.name": "نام گروه",
    "group.namePlaceholder": "مثلاً: تیم راه‌اندازی",
    "group.addPeople": "افزودن افراد",
    "group.selected": "{count} نفر انتخاب شده‌اند",
    "group.loadingContacts": "در حال بارگذاری مخاطبان…",
    "group.noContacts": "هنوز مخاطبی نداری؛ اول از بخش جست‌وجو چند نفر اضافه کن.",
    "group.onePersonHelp": "برای گروه تک‌نفره، نام گروه را وارد کن یا یک نفر دیگر انتخاب کن.",
    "group.create": "ساخت گروه",
    "message.deleteTitle": "پیام حذف شود؟",
    "message.deleteHelp": "این پیام برای همه‌ی افراد این گفت‌وگو حذف می‌شود و نمی‌توان آن را برگرداند.",
    "message.delete": "حذف پیام",
    "theme.title": "پوسته",
    "theme.graphite": "گرافیت",
    "theme.neon": "نئون",
    "theme.aurora": "شفق",
    "theme.cyber": "سایبر",
    "theme.sunset": "غروب",
    "theme.candy": "آب‌نبات",
    "chat.background": "پس‌زمینه‌ی گفت‌وگو",
    "chat.backgroundHint": "فقط برای همین گفت‌وگو روی این دستگاه اعمال می‌شود.",
    "chat.backgroundDefault": "پیش‌فرض پوسته",
    "chat.backgroundDots": "نقطه‌ای",
    "chat.backgroundGrid": "شبکه‌ای",
    "chat.backgroundWaves": "موج",
    "chat.backgroundSunset": "غروب",
    "chat.backgroundOcean": "اقیانوس",
    "chat.backgroundForest": "جنگل",
    "chat.backgroundDusk": "گرگ‌ومیش",
    "error.title": "مشکلی پیش آمد",
    "error.notFound": "صفحه پیدا نشد",
    "error.backHome": "بازگشت به خانه",
  }
} as const;

export type Locale = keyof typeof messages;
export type MessageKey = keyof typeof messages.en;
type LocaleContextValue = { locale: Locale; setLocale: (locale: Locale) => void; t: (key: MessageKey, values?: Record<string, string | number>) => string };

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fa");

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem("messenger-locale", next);
  }, []);

  const t = useCallback((key: MessageKey, values?: Record<string, string | number>) => {
    let value: string = messages[locale][key];
    if (values) {
      for (const [name, replacement] of Object.entries(values)) {
        value = value.replaceAll(`{${name}}`, String(replacement));
      }
    }
    return value;
  }, [locale]);

  useEffect(() => {
    const stored = window.localStorage.getItem("messenger-locale");
    // Applying the stored locale after mount is deliberate: the server always
    // renders the default locale, so reading localStorage during render would
    // break hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === "fa" || stored === "en") setLocaleState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "fa" ? "rtl" : "ltr";
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale must be used within LocaleProvider");
  return value;
}

export function LanguageToggle({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const { locale, setLocale, t } = useLocale();
  return (
    <button
      type="button"
      lang={locale === "fa" ? "en" : "fa"}
      aria-label={t("language.switch")}
      onClick={() => setLocale(locale === "fa" ? "en" : "fa")}
      className={`inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-border-default px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary ${className}`}
    >
      <span aria-hidden="true">{locale === "fa" ? "EN" : "فا"}</span>
      {!compact && <span>{locale === "fa" ? "English" : "فارسی"}</span>}
    </button>
  );
}
