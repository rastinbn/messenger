# Deployment

This covers running Messenger outside local dev. It describes what exists today (Phase 2 baseline)
and flags what's a placeholder vs. production-ready.

## Local development

```bash
docker compose up -d          # Postgres + Redis
pnpm install
cp apps/api/.env.example apps/api/.env   # fill in real secrets
pnpm --filter @messenger/api prisma:migrate:dev
pnpm --filter @messenger/api prisma:seed  # optional, demo data
pnpm --filter @messenger/api dev          # API on :4000
pnpm --filter @messenger/web dev                     # frontend on :3000
```

Point the frontend at the real API by implementing `httpServices` behind the existing
`ServiceProvider` (see `docs/frontend.md` and `docs/architecture.md`) — this hasn't been wired yet;
the frontend still defaults to `mockServices` until that swap is made.

## Environment variables

See `apps/api/.env.example` for the full list. Required in any non-local environment:

- `DATABASE_URL` — PostgreSQL connection string.
- `REDIS_URL` — Redis connection string.
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — must be long, random, and **different from each
  other** and from anything in this repo's example file. Rotate them and every issued token is
  invalidated — plan for that.
- `CORS_ORIGINS` — comma-separated allow-list of frontend origins. No wildcard in production.

`validateEnv` (`apps/api/src/config/env.validation.ts`) fails startup immediately with a clear
message if anything required is missing/malformed — the app will not silently boot in a broken
config state.

## Database

Run migrations as a deploy step, before the new app version receives traffic:

```bash
pnpm --filter @messenger/api prisma:migrate:deploy
```

Never `prisma db push` in production. Never let application startup implicitly run migrations —
keep that a distinct, observable deploy step.

## Media storage — placeholder, needs replacing before production

The current `MediaController` stores uploads on local disk (`MEDIA_UPLOAD_DIR`) and serves them via
`ServeStaticModule` at `/uploads/*`. This **does not work** across multiple API instances/replicas
(each would have its own disk) and has no CDN/caching in front of it. Before a real multi-instance
deployment:

1. Replace the `diskStorage` multer engine in `media.controller.ts` with an S3-compatible SDK
   (AWS S3, Cloudflare R2, etc.), uploading directly or via a presigned-URL flow.
2. Store the resulting object URL in the `Attachment.url` field — no other schema change needed,
   since `url` was always an opaque string.
3. Remove `ServeStaticModule` for `/uploads` once nothing depends on local disk.

## Realtime / Socket.IO at scale

The current `PresenceService` already uses Redis (not in-memory state), which is the right
foundation for running multiple API instances — but Socket.IO itself also needs the
`@socket.io/redis-adapter` wired into `MessagingGateway` so that a broadcast to a conversation room
reaches sockets connected to *other* instances, not just the instance that received the emit. This
is a required addition, not yet done, before running more than one API replica.

## Deploying to Render

Two services: the API (NestJS) and the web app (Next.js), plus a Postgres database and a Redis URL.

**API service**

| Setting | Value |
|---|---|
| Root directory | repository root (the monorepo, not `apps/api`) |
| Build command | `corepack enable && pnpm install --frozen-lockfile && pnpm --filter @messenger/api exec prisma generate && pnpm --filter @messenger/api build` |
| Pre-deploy command | `pnpm --filter @messenger/api prisma:migrate:deploy` |
| Start command | `pnpm --filter @messenger/api start:prod` |
| Health check path | `/v1/health` |

`start:prod` runs `node dist/main`, so `nest build` must emit `dist/main.js`. That is what
`apps/api/tsconfig.build.json` pins with `rootDir: ./src` + `include: ["src/**/*.ts"]`; without it,
tsc takes the common root of `src/` *and* `prisma/` and emits `dist/src/main.js`, and the service
crashes on boot with `Cannot find module '/opt/render/project/src/apps/api/dist/main'`.

Required environment variables on the API service:

- `DATABASE_URL` — from the Render Postgres instance (internal connection string).
- `REDIS_URL` — Render no longer provisions Redis for new accounts; use Upstash/Redis Cloud and use
  the TLS URL (`rediss://…`). The app only needs `SET`/`GET`/`DEL` + expiry.
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — 32+ random characters, different from each other.
- `CORS_ORIGINS` — the deployed web origin, e.g. `https://messenger-web.onrender.com`
  (comma-separated for several; no wildcards).
- `APP_URL` — same web origin (used in emails).
- `PORT` — Render injects it; `main.ts` reads it, and Nest binds all interfaces.

**Web service**

| Setting | Value |
|---|---|
| Build command | `corepack enable && pnpm install --frozen-lockfile && pnpm --filter @messenger/web build` |
| Start command | `pnpm --filter @messenger/web start` |
| Env | `NEXT_PUBLIC_API_URL=https://<api-service>.onrender.com` |

`NEXT_PUBLIC_*` is baked in at **build** time, so changing it requires a redeploy, and the API's
`CORS_ORIGINS` must contain the web origin or every request fails in the browser.

**Gotchas**

- **Uploads are ephemeral.** `MEDIA_UPLOAD_DIR` points at the instance disk, which is wiped on every
  deploy. Either attach a Render disk and set `MEDIA_UPLOAD_DIR` to its mount path, or move to S3/R2
  (see the media-storage section above).
- **Free instances spin down** after idle time; the first request then takes ~30s and Socket.IO
  reconnects on its own.
- **Migrations belong in a separate deploy step**, before the new version takes traffic — not in
  application startup. A slow migration would otherwise delay or abort the boot, and two instances
  would race. The start-command variant below is a fallback for a single-instance free deployment,
  not the target design.
- WebSocket upgrades pass through Render's proxy on the same port as HTTP, so no extra config is
  needed for Socket.IO.

### Free plan: applying migrations without a Shell

The free plan has no Shell (and no pre-deploy command), so a fresh database starts empty and the
first request fails with `The table public.users does not exist in the current database`. The
migrations still have to run once, *before* the first deploy of a new schema.

**Option 1 (recommended): run them yourself, right before deploying.** Render Postgres is reachable
from outside through its *external* connection string (Dashboard → the database → Connect → External
Database URL). Point Prisma at it for this one command — the app's own `DATABASE_URL` in Render stays
the internal one:

```powershell
$env:DATABASE_URL="postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require"
pnpm --filter @messenger/api prisma:migrate:deploy
pnpm --filter @messenger/api db:check
```

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require" \
  pnpm --filter @messenger/api prisma:migrate:deploy
```

A process environment variable wins over `apps/api/.env`, so the local database is left untouched.
Add `?sslmode=require` if the connection is rejected over SSL.

**Option 2: a separate GitHub Actions job.** `.github/workflows/migrate.yml` runs the same two
commands against the production database, manually triggered (`workflow_dispatch`) and serialised by
a `concurrency` group so two deploys can never migrate at once. It needs a `DATABASE_URL` repository
secret holding the external connection string.

**Fallback: migrate on boot.** `pnpm --filter @messenger/api start:prod:migrate` runs
`prisma migrate deploy` and then `node dist/main`. Acceptable only for a single-instance experiment:
it makes boot depend on the database, and a long migration turns into a failed deploy.

**Heads-up:** Render deletes free Postgres instances 30 days after creation, and free web services
spin down after 15 minutes of idle time (the next request takes ~30s to wake them).

### Verifying a database before/after deploying

`prisma migrate status` only reads `_prisma_migrations`; a database can claim to be up to date while a
table is missing. `db:check` asserts both the migration bookkeeping *and* the actual schema the
running build needs:

```bash
DATABASE_URL="postgresql://…?sslmode=require" pnpm --filter @messenger/api db:check
```

It reports applied/pending/unknown migrations, required tables, and the columns added by later
migrations, and exits non-zero if anything is missing. A green local run proves nothing about the
deployed database — always point `DATABASE_URL` at the real one.

## Process / infrastructure

Not opinionated by this repo — deploy the NestJS app (`apps/api`) as a standard Node.js process
(Docker image, `node dist/main.js` after `pnpm build`) behind a load balancer/reverse proxy that
terminates TLS and forwards WebSocket upgrade requests. The frontend (`apps/web`) is a standard
Next.js app — deploy per Next.js's normal deployment docs (Node server or a platform that supports
it) since it uses server-side rendering, not static export.

## Health checks

`GET /v1/health` (public) checks DB + Redis connectivity — point your load balancer / orchestrator
readiness probe at this.

## What's explicitly NOT production-hardened yet

Flagging honestly rather than silently shipping gaps:
- No per-route rate limiting beyond the global 120 req/min/IP default (login/register brute-force
  protection specifically is a documented follow-up).
- No Socket.IO Redis adapter yet (single-instance realtime only — see above).
- No refresh-token cleanup job (expired/revoked rows accumulate — see `docs/database.md`).
- No orphaned-attachment cleanup job.
- Media storage is local-disk (see above).
- No structured/centralized logging or APM integration configured — only Nest's default `Logger`.
