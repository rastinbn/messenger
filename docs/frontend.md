# Frontend (Phase 1)

Status: **complete**, built entirely against mocked services — no backend, no API calls, no database.

## Running it

```bash
pnpm install
pnpm --filter web dev
```

Visit `http://localhost:3000`. Any email/password on the login or register form works — the mock auth service accepts anything and signs you in as the seeded demo user ("You").

## Structure

```
apps/web/src/
├── app/                        Next.js App Router routes
│   ├── (marketing)/page.tsx    Landing page (public)
│   ├── login/, register/       Auth pages (public)
│   ├── (app)/                  Authenticated app shell (wrapped in AuthGuard)
│   │   ├── layout.tsx          NavRail + MobileTabBar + global modals
│   │   ├── chat/               Chat list layout, empty state, chat window ([conversationId])
│   │   ├── contacts/
│   │   ├── search/
│   │   ├── notifications/
│   │   ├── settings/
│   │   └── profile/[userId]/
│   ├── not-found.tsx, error.tsx, global-error.tsx
│   └── layout.tsx, globals.css Root layout, design tokens
├── components/
│   ├── ui/                     Design-system primitives (Button, Input, Avatar, Modal, …)
│   ├── chat/                   Chat-specific components (ChatBubble, MessageList, …)
│   ├── layout/                 NavRail, MobileTabBar, ConversationListPanel, AuthGuard
│   └── providers/               ServiceProvider, QueryProvider, ThemeInitializer
├── hooks/                       TanStack Query hooks wrapping the service layer
├── stores/                      Zustand: useUiStore (ephemeral UI), useThemeStore
└── lib/
    ├── services/                 Service interfaces (the Phase 1/2 boundary) + mock/ implementations
    ├── fixtures/                 In-memory seed data (users, conversations, messages, notifications)
    └── cn.ts, formatBytes.ts, formatTime.ts   small utilities
```

## The service abstraction layer

Every piece of data in the UI flows through an interface defined in `lib/services/types.ts`
(`AuthService`, `UserService`, `ContactsService`, `ChatService`, `NotificationService`).
`lib/services/mock/` provides `Mock*` implementations backed by in-memory fixtures with
simulated network latency (`delay()`), so the UI already behaves like it's talking to a real
network — loading states, optimistic-feeling updates, and even simulated realtime (typing
indicators and canned replies arriving a couple seconds after you send a message).

`ServiceProvider` (`components/providers/ServiceProvider.tsx`) is the single place that decides
which implementation is active. **Phase 2 replaces one line** — swapping `mockServices` for a
future `httpServices` bundle — and no component or hook needs to change, because they all consume
`useServices()` rather than importing a concrete implementation.

TanStack Query hooks in `hooks/` wrap each service call (`useConversations`, `useMessages`,
`useSendMessage`, etc.), giving caching, invalidation, and loading/error states for free. The
realtime-shaped methods (`chat.onMessage`, `chat.onTyping`) are wired into the Query cache via
`useEffect` subscriptions — the exact shape a Socket.IO listener will take in Phase 2.

## State management

- **Server state** (conversations, messages, users, notifications): TanStack Query, via the hooks
  above. Nothing server-shaped lives in Zustand.
- **UI state** (`stores/useUiStore.ts`): active conversation id, mobile list open/closed, per-conversation
  message drafts, image viewer / file preview modal state.
- **Theme** (`stores/useThemeStore.ts`): persisted to `localStorage`, applied via `data-theme` on
  `<html>`, read by CSS custom properties in `globals.css`.

## Design system

Tokens live in `app/globals.css` as CSS custom properties, re-exposed to Tailwind v4 via `@theme
inline`. Dark mode is the default; light mode is a full second token set behind
`[data-theme="light"]`. The signature interaction device — explained in the design plan — is the
"ink stroke": conversation unread state is shown as a thin accent-colored rule on the conversation
row rather than a badge-heavy UI, with badges reserved for exact counts.

**Sandbox note:** `next/font/google` needs network access this dev sandbox's egress allowlist
doesn't grant, so `app/layout.tsx` currently ships with system-font fallback stacks and a comment
showing the one-line swap back to `next/font/google` (Inter / Space Grotesk / JetBrains Mono) for
any environment with normal internet access.

## Accessibility

- Visible focus rings everywhere (`:focus-visible` in `globals.css`), never suppressed.
- `prefers-reduced-motion: reduce` disables all animation/transition durations.
- Interactive primitives carry appropriate ARIA: `role="dialog"`/`aria-modal` on Modal,
  `role="menu"`/`role="menuitem"` on Dropdown/ContextMenu, `aria-current="page"` on active nav
  items, `aria-live="polite"` on the typing indicator, `alt`/`aria-label` on icon-only buttons.
- Forms use `<label>` associated via `htmlFor`/`id`, `aria-invalid`, and `aria-describedby` for
  error/hint text (see `components/ui/Input`).

## Responsive behavior

- **Desktop (`md:` and up):** 3-pane layout — `NavRail` (icon rail) → `ConversationListPanel` →
  active chat window / page content.
- **Mobile (below `md`):** single-pane, with `MobileTabBar` replacing `NavRail`. The conversation
  list and the active chat window are mutually exclusive on mobile, driven by
  `useUiStore().isMobileConversationListOpen`; opening a chat hides the list, the header's back
  button restores it.

## Verification performed

- `pnpm --filter web typecheck` — clean.
- `pnpm --filter web lint` — clean.
- `pnpm --filter web build` — all 11 route segments compile and prerender/build successfully.
- Dev server smoke test — every page (`/`, `/login`, `/register`, `/chat`, `/chat/[id]`,
  `/contacts`, `/notifications`, `/search`, `/settings`, `/profile/[userId]`) returns HTTP 200 with
  no server-side errors; an unknown path correctly returns the custom 404 page.

## Known simplifications (intentional, Phase 1 scope)

- Emoji picker is a placeholder (quick-reaction grid) per the original component spec — a full
  emoji set/search is a follow-up, not required for Phase 1 completion.
- Image/file attachments render structured placeholder cards (no real binary upload/storage exists
  until Phase 2 media upload is built).
- Mock realtime (typing + canned replies) only simulates one open tab; true multi-client realtime
  arrives with the Phase 2 Socket.IO gateway.
