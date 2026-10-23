import Link from "next/link";

import { Button } from "@/components/ui/Button";

const FEATURES = [
  {
    title: "Real conversations, calmly organized",
    body: "Unread state lives in a single thin stroke, not a wall of badges — so a busy inbox still reads at a glance."
  },
  {
    title: "Built for groups and DMs alike",
    body: "Direct messages and group chats share one fast, consistent interface — no mode-switching."
  },
  {
    title: "Open source, end to end",
    body: "Full source, MIT licensed. Self-host it, fork it, or just read how it's built."
  }
];

export default function LandingPage() {
  return (
    <main className="flex-1 flex flex-col">
      <header className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-border-subtle">
        <span className="font-display text-lg font-semibold">Messenger</span>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-text-secondary hover:text-text-primary px-3 py-2">
            Log in
          </Link>
          <Link href="/register">
            <Button size="sm">Get started</Button>
          </Link>
        </nav>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 md:py-32">
        <h1 className="font-display text-4xl md:text-6xl font-semibold max-w-2xl text-balance">
          A calm place for conversations that never stop.
        </h1>
        <p className="text-text-secondary text-lg max-w-xl mt-5 text-balance">
          An open-source messenger for people who run a lot of threads at once — fast, legible, and yours to run anywhere.
        </p>
        <div className="flex items-center gap-3 mt-8">
          <Link href="/register">
            <Button size="lg">Create an account</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="secondary">
              Log in
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-px bg-border-subtle border-y border-border-subtle">
        {FEATURES.map((f) => (
          <div key={f.title} className="bg-bg-base px-8 py-10">
            <h2 className="font-display text-lg mb-2">{f.title}</h2>
            <p className="text-sm text-text-secondary leading-relaxed">{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="px-6 md:px-10 py-6 text-xs text-text-muted flex items-center justify-between">
        <span>© 2026 Messenger — MIT Licensed</span>
        <a
          href="https://github.com"
          className="hover:text-text-primary"
          target="_blank"
          rel="noreferrer"
        >
          View source
        </a>
      </footer>
    </main>
  );
}
