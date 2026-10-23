# Database

PostgreSQL via Prisma. Schema source of truth: `apps/api/prisma/schema.prisma`.

## Entity overview

```
User ──< ConversationParticipant >── Conversation ──< Message >── Attachment
  │                                                       │
  ├──< RefreshToken                                       │ (senderId)
  ├──< ContactLink >── User (self-referential, two named relations)
  └──< Notification
```

- **User** — account + profile. `passwordHash` is argon2id. `status`/`statusMessage` mirror the
  frontend's `User` shared type.
- **RefreshToken** — one row per issued refresh token. `tokenHash` is a SHA-256 digest (not the raw
  token, not argon2 — see `docs/api.md` for why). `revokedAt` set on rotation/logout; expired or
  revoked rows are never deleted automatically (kept for audit; a cleanup job is a documented
  follow-up, not yet built).
- **ContactLink** — directional (`initiatorId` → `recipientId`) with a `status` enum
  (`pending`/`accepted`). The current frontend has no request/accept UI yet, so links default to
  `accepted` on creation — this is a deliberate placeholder, not a finished feature; wiring up
  `pending` requires a frontend follow-up.
- **Conversation** — `type` is `direct` or `group`. `name`/`avatarUrl` are null for direct
  conversations (derived client-side from the other participant).
- **ConversationParticipant** — join table carrying per-user state: `role`, `lastReadAt` (drives
  unread-count calculation — see below).
- **Message** — belongs to one conversation and one sender. `status` (`sending`/`sent`/`delivered`/`read`/`failed`)
  is currently set once at creation (`sent`); full per-recipient delivery/read status tracking
  (as opposed to the simple `lastReadAt` watermark below) is a documented future enhancement.
- **Attachment** — `messageId` is **nullable**: a file is uploaded (and gets an `Attachment` row)
  *before* the message that references it exists, since the client must know the attachment id to
  include it in the send-message payload. Orphaned attachments (uploaded, never attached to a
  message) are not currently garbage-collected — follow-up.
- **Notification** — denormalized `title`/`body` (not a live join back to the source event) so a
  notification remains meaningful even if the underlying message/conversation is later edited or
  deleted.

## Unread counts

Not a stored column. Computed at read time: `count(Message where conversationId = X AND senderId
!= me AND createdAt > myParticipant.lastReadAt)`. Simple and always-correct, at the cost of a
`COUNT` query per conversation per list-conversations call — acceptable at this scale; if it
becomes a bottleneck, the standard fix is a denormalized `unreadCount` column maintained
transactionally on message insert, not a schema redesign.

## Migrations

Never hand-edit the database or run `prisma db push` against anything but a throwaway local
database. Always go through migrations:

```bash
pnpm --filter @messenger/api prisma:migrate:dev --name <description>
```

This generates a new file under `apps/api/prisma/migrations/` — commit it. In production:

```bash
pnpm --filter @messenger/api prisma:migrate:deploy
```

which applies pending migrations without prompting or generating new ones.

## Seeding

```bash
pnpm --filter @messenger/api prisma:seed
```

Populates data that mirrors the frontend's mock fixtures (`apps/web/src/lib/fixtures/`) — same
people, same starter conversations — so switching the frontend from mock services to the live API
produces a familiar demo state. Demo login: `you@example.com` / `password123`.

## Indexes

Kept intentionally minimal and query-driven rather than speculative:
- `Message(conversationId, createdAt)` — the message-list pagination query.
- `Notification(userId, createdAt)` — the notification-list query.
- `ConversationParticipant(conversationId, userId)` unique — participant lookups + prevents duplicate membership.
- `RefreshToken.tokenHash` unique — the refresh/logout lookup path.

Add more only when a real slow-query log or `EXPLAIN ANALYZE` justifies it, not preemptively.
