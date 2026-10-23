# Messenger

An open-source, production-grade messaging platform inspired by Telegram and Discord.

> **Status:** Phase 0 (Planning) and Phase 1 (Frontend) complete. Phase 2 (Backend) — core implementation complete (Auth, Users, Conversations, Messaging + Socket.IO realtime, Presence, Notifications, Media upload), pending review. Frontend is not yet wired to the live API — it still runs on `mockServices` until that swap is made.

## Monorepo Layout

```
apps/web             Next.js frontend
apps/api              NestJS backend (Phase 2 — implemented, pending review)
packages/shared-types Shared TypeScript types & Zod schemas
packages/config       Shared ESLint / TypeScript configs
docs/                 Architecture, API, DB, protocol, deployment docs
```

## Tech Stack

**Frontend:** Next.js, React, TypeScript, Tailwind CSS, TanStack Query, Zustand, React Hook Form, Zod

**Backend:** Node.js, NestJS, TypeScript, PostgreSQL, Prisma, Redis, Socket.IO

## Getting Started

Requires Node.js 22+ and pnpm 9+.

### Frontend only (mocked data, no backend needed)

```bash
pnpm install
pnpm --filter web dev
```

Then open `http://localhost:3000`. Any email/password on login/register works.

### Full stack (frontend + real backend)

```bash
docker compose up -d                      # Postgres + Redis
pnpm install
cp apps/api/.env.example apps/api/.env    # fill in real secrets
pnpm --filter @messenger/api prisma:generate
pnpm --filter @messenger/api prisma:migrate:dev
pnpm --filter @messenger/api prisma:seed  # optional demo data — login: you@example.com / password123
pnpm --filter @messenger/api dev          # API on :4000, docs at :4000/docs
pnpm --filter web dev                     # frontend on :3000
```

See [`docs/deployment.md`](docs/deployment.md) for details, and [`docs/frontend.md`](docs/frontend.md)
for how the frontend's mock service layer works (it isn't wired to the live API yet — see below).

## Development Phases

This project is built in strict, approved phases — see [`docs/architecture.md`](docs/architecture.md) for full rationale.

- **Phase 0 — Planning:** architecture, conventions, folder structure (this doc set) — ✅ complete
- **Phase 1 — Frontend:** full UI on mocked services, no backend — ✅ complete
- **Phase 2 — Backend:** NestJS API + Socket.IO + PostgreSQL — ✅ core implementation complete
  (see [`docs/api.md`](docs/api.md), [`docs/database.md`](docs/database.md),
  [`docs/socket-protocol.md`](docs/socket-protocol.md), [`docs/deployment.md`](docs/deployment.md)).
  Frontend↔API wiring (replacing `mockServices` with a real `httpServices` implementation) is the
  next step, not yet done.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

## License

See [`LICENSE`](LICENSE).
