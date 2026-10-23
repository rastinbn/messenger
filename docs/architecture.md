# Architecture

## Goals

Optimize for maintainability, scalability, security, developer experience, and long-term evolution — in that priority order over short-term velocity.

## Monorepo

`pnpm` workspaces + `Turborepo`. Chosen for:
- Native workspace protocol support (`workspace:*` deps between packages)
- Turborepo's task caching/pipelining across `apps/*` and `packages/*`
- Low config overhead compared to Nx, while still scaling to many packages

## Phased Delivery

Development proceeds in strictly ordered, approved phases:

1. **Phase 0 — Planning** (this document set): architecture, folder structure, conventions.
2. **Phase 1 — Frontend only**: full application UI against a **service abstraction layer** backed by mocked implementations. No backend, no API, no DB.
3. **Phase 2 — Backend**: NestJS API, PostgreSQL/Prisma, Redis, Socket.IO — wired in to replace the mock service implementations behind the same interfaces.

The phase boundary is enforced by the service abstraction layer (see below) — this is the mechanism that makes "swap mocks for real APIs with minimal changes" true rather than aspirational.

## Frontend Architecture (Phase 1)

### Service Abstraction Layer

Every piece of data the UI needs goes through a **service interface**, e.g.:

```ts
interface ChatService {
  listConversations(): Promise<Conversation[]>;
  getMessages(conversationId: string, cursor?: string): Promise<Message[]>;
  sendMessage(input: SendMessageInput): Promise<Message>;
  // ...
}
```

- Phase 1 provides `MockChatService implements ChatService`, backed by in-memory fixtures + artificial latency to simulate real network behavior.
- Phase 2 provides `HttpChatService implements ChatService`, backed by real REST/WS calls.
- Components and hooks depend only on the interface (injected via a small service-provider/context), never on the mock or HTTP implementation directly.

### State Management

- **TanStack Query** — all server-state (conversations, messages, users, notifications) flows through Query hooks that call the service layer. This means query keys, caching, and invalidation logic are already correct before Phase 2 exists.
- **Zustand** — local/ephemeral UI state only: active conversation ID, modal open state, draft message text, theme preference, sidebar collapse state. Never server data.

### Data Contracts

All shapes are defined once in `packages/shared-types` using Zod schemas, with TypeScript types inferred from them (`z.infer`). Both the mock service layer and (in Phase 2) the NestJS DTOs validate against the same schemas. This is the single source of truth for what a `User`, `Conversation`, `Message`, etc. looks like.

## Backend Architecture (Phase 2)

Clean Architecture, per module (`auth`, `users`, `conversations`, `messaging`, `presence`, `notifications`, `media`):

```
domain/         entities, value objects, domain errors — zero framework dependencies
application/    use-cases / services, and "ports" (interfaces for repositories, gateways)
infrastructure/ Prisma repository implementations, Redis clients, Socket.IO gateway impls
interface/      REST controllers, WS gateways, request/response DTOs, validation pipes
```

Dependency direction always points inward: `interface` → `application` → `domain`, with `infrastructure` implementing ports defined in `application`. Controllers stay thin (parse/validate/delegate); all business logic lives in application-layer services.

## Realtime Protocol

Socket.IO namespace per concern (e.g. `/presence`, `/chat`), documented in `docs/socket-protocol.md` once Phase 2 begins. Must support: authenticated handshake, presence broadcast, typing indicators, message delivery, read receipts, reconnection with backfill, heartbeat.

## Security Posture

JWT access tokens (short-lived) + refresh tokens (rotated, stored hashed), bcrypt/argon2 password hashing, class-validator on every DTO, Helmet, CORS allow-list, per-route rate limiting. No secrets in source control — `.env.example` only, real secrets via environment/secret manager at deploy time.

## Non-Goals (v1)

Voice/video calls, Discord-style guild/server spaces, end-to-end encryption, bots/webhooks, federation. These are tracked in the roadmap for future consideration, not silently dropped.
