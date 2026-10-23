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
pnpm --filter web dev                     # frontend on :3000
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
