# API

Base URL: `http://localhost:4000` (configurable via `PORT`). All REST routes are versioned under
`/v1`. Full interactive OpenAPI docs are served at `/docs` (Swagger UI) once the server is running.

## Authentication

JWT bearer tokens. Every route requires `Authorization: Bearer <accessToken>` **unless** explicitly
marked public (`auth/register`, `auth/login`, `auth/refresh`, `health`).

- **Access token**: short-lived (default 15m, `JWT_ACCESS_TTL`), a signed JWT carrying `{ sub, email, username }`.
- **Refresh token**: long-lived (default 30d, `JWT_REFRESH_TTL`), an opaque high-entropy random
  value. Stored server-side only as a SHA-256 hash (not the access-token JWT secret — a distinct,
  fast, deterministic hash, since we need equality lookup and refresh tokens are already
  high-entropy, so slow salted hashing isn't needed for that value). **Single-use**: presenting a
  refresh token immediately revokes it and issues a new pair (rotation). Reusing a revoked/expired
  refresh token fails with 401.

### Auth endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/v1/auth/register` | Public | Create an account, returns `AuthSession` |
| POST | `/v1/auth/login` | Public | Returns `AuthSession` |
| POST | `/v1/auth/refresh` | Public (body carries refresh token) | Rotates tokens, returns new `AuthSession` |
| POST | `/v1/auth/logout` | Bearer | Revokes the presented refresh token |
| POST | `/v1/auth/logout-all` | Bearer | Revokes every refresh token for the user (all devices) |

`AuthSession` shape matches `packages/shared-types`' `AuthSession` schema: `{ user, accessToken, refreshToken, expiresAt }`.

## Users

| Method | Path | Description |
|---|---|---|
| GET | `/v1/users/me` | Full profile of the current user |
| PATCH | `/v1/users/me` | Update `displayName` / `avatarUrl` / `statusMessage` |
| PATCH | `/v1/users/me/status` | Update presence status (`online`/`away`/`offline`/`dnd`) |
| GET | `/v1/users/search?q=` | Search other users by display name/username |
| GET | `/v1/users/:id` | Another user's public profile |

## Conversations

| Method | Path | Description |
|---|---|---|
| GET | `/v1/conversations` | List conversations the current user participates in, newest-activity-first |
| GET | `/v1/conversations/:id` | Get a single conversation |
| POST | `/v1/conversations` | Create a conversation (`participantIds`, optional `name`). 1:1 DMs are deduped — creating a DM with someone you already have one with returns the existing conversation. |
| PUT | `/v1/conversations/:id/read` | Mark the conversation read up to now for the current user |

## Messages

Nested under conversations.

| Method | Path | Description |
|---|---|---|
| GET | `/v1/conversations/:conversationId/messages?cursor=` | Cursor-paginated (50/page), returned oldest-first per page |
| POST | `/v1/conversations/:conversationId/messages` | Send a message (`content`, optional `attachmentIds`, optional `replyToId`) |
| POST | `/v1/messages/:messageId/forward` | Copy a message into another conversation (`conversationId`). The copy is a normal message flagged `forwarded: true` with cloned attachments. |
| DELETE | `/v1/messages/:messageId` | Soft-delete one of **your own** messages. Returns the tombstone (`deletedAt` set, `content: ""`, no attachments); repeating it is a no-op. |

Sending a message via REST triggers the exact same realtime broadcast as sending over the
Socket.IO gateway (see `docs/socket-protocol.md`) — both paths go through `MessagingService`, which
emits a `message.created` domain event that the gateway subscribes to.

Replies are stored on the message as `replyToId`; every read path embeds a compact
`replyTo: { id, senderId, senderName, content, deletedAt } | null` quote so clients can render the
reference without a second request. Deleting is a soft delete so replies pointing at the message and
cursor pagination both stay valid; deletions broadcast `message:deleted` (see the socket doc).

## Notifications

| Method | Path | Description |
|---|---|---|
| GET | `/v1/notifications` | Latest 50 notifications for the current user |
| PUT | `/v1/notifications/:id/read` | Mark one as read |
| PUT | `/v1/notifications/read-all` | Mark all as read |

## Media

| Method | Path | Description |
|---|---|---|
| POST | `/v1/media/upload` | `multipart/form-data`, field name `file`. Returns an attachment record (`id`, `url`, `fileName`, `mimeType`, `sizeBytes`, `width?`, `height?`). Reference the returned `id` in `attachmentIds` when sending a message. |

Upload constraints: max size `MEDIA_MAX_FILE_SIZE_BYTES` (default 10MB), allowed MIME types are a
fixed allow-list (images, PDF, plain text, zip, Word docs) — see `media.controller.ts`. Files are
stored on local disk under `MEDIA_UPLOAD_DIR` and served statically at `/uploads/*` in this
baseline implementation; swap for S3/R2 in production (see `docs/deployment.md`).

## Health

| Method | Path | Description |
|---|---|---|
| GET | `/v1/health` | Public. Checks DB + Redis connectivity, returns `{ status, database, redis }` |

## Error format

Every error response (validation failures, domain errors, unexpected exceptions) is normalized by
the global exception filter to:

```json
{ "statusCode": 400, "path": "/v1/auth/login", "timestamp": "...", "message": "..." }
```

Unexpected (non-`HttpException`) errors never leak stack traces or internal details — they're
logged server-side and returned as a generic 500.

## Rate limiting

Global default: 120 requests/minute/IP (`ThrottlerModule`, see `app.module.ts`). Tighten
per-route with `@Throttle()` where a specific endpoint needs a stricter limit (e.g. login/register
brute-force protection is a documented follow-up, not yet applied per-route).

## Versioning

URI versioning (`/v1/...`). Breaking changes ship as `/v2/...` alongside `/v1/...`, never by
mutating `/v1` in place.
