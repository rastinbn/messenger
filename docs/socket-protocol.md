# Socket.IO Protocol

Implementation: `apps/api/src/modules/messaging/interface/ws/messaging.gateway.ts`. Single gateway,
default namespace (`/`).

## Connecting

```js
import { io } from "socket.io-client";

const socket = io("http://localhost:4000", {
  auth: { token: accessToken } // the JWT access token from AuthSession
});
```

The gateway also accepts the token as an `Authorization: Bearer <token>` handshake header as a
fallback. A connection with a missing/invalid/expired token receives an `error` event and is
immediately disconnected — there is no anonymous/guest connection mode.

On successful connection, the server automatically joins the socket to:
- `user:<userId>` — a personal room, used for user-targeted pushes.
- `conversation:<id>` — one room per conversation the user currently participates in, computed at
  connect time. **A client that creates or joins a new conversation after connecting must
  reconnect (or the server must be extended to dynamically join rooms) to receive events for it in
  this version** — documented limitation, not yet handled by a `conversation:join` event.

## Presence

- On connect: server marks the user online in Redis (TTL-based, see `docs/architecture.md` /
  `RedisService`) and broadcasts `presence:update` to **all** connected clients (not scoped to
  shared conversations — acceptable at this scale, would need scoping to participants-only for a
  larger deployment).
- On disconnect: if this was the user's *last* connected socket (multi-tab/multi-device aware), the
  server marks them offline and broadcasts the same event with `online: false`.
- Heartbeat: server-side timer refreshes the Redis presence TTL every 25s per connected socket
  automatically — no client action required. A client can also proactively emit `heartbeat` (e.g.
  on tab visibility change) to refresh sooner.

**Server → client:** `presence:update`
```ts
{ userId: string; online: boolean }
```

## Typing indicators

**Client → server:** `typing:start` / `typing:stop`
```ts
{ conversationId: string }
```

**Server → client(s in that conversation room, excluding sender):** `typing:update`
```ts
{ conversationId: string; userId: string; isTyping: boolean }
```

The client is responsible for debouncing/timing out `typing:stop` (the frontend's
`MessageComposer` does this with a 1.5s idle timeout) — the server does not auto-expire typing
state.

## Sending messages

**Client → server:** `message:send`
```ts
{ conversationId: string; content: string; attachmentIds?: string[]; replyToId?: string }
```

This calls the same `MessagingService.sendMessage` use-case the REST endpoint
(`POST /v1/conversations/:id/messages`) uses. The service emits an internal `message.created`
event; the gateway listens for that (not for the raw socket call) and broadcasts to the
conversation room — so a message sent via REST is delivered over the socket identically to one
sent via `message:send`. There is no separate ack payload on `message:send` itself in this
version; the created message arrives via `message:new` to everyone in the room, including the
sender's own other connections.

**Server → client(s in that conversation room):** `message:new`
```ts
MessageDto // see docs/api.md — same shape as the REST response
```

## Deleting messages

Deleting is REST-only (`DELETE /v1/messages/:messageId`); the server broadcasts the tombstone to the
whole room, including the author's other tabs, so nobody needs to refetch the thread.

**Server → client(s in that conversation room):** `message:deleted`
```ts
MessageDto // content: "", attachments: [], deletedAt: <ISO timestamp>
```

## Read receipts

**Client → server:** `message:read`
```ts
{ conversationId: string }
```
Marks the conversation read (same effect as `PUT /v1/conversations/:id/read`) and broadcasts to
the rest of the room.

**Server → client(s in that conversation room, excluding the reader):** `message:read`
```ts
{ conversationId: string; userId: string; readAt: string /* ISO 8601 */ }
```

## Reconnection

Standard Socket.IO client reconnection (exponential backoff) works out of the box — the server
performs the same handshake auth + room-join sequence on every new connection, so a reconnect
naturally re-syncs room membership and presence. There is currently no "catch-up" mechanism for
events missed while disconnected (e.g. messages sent to a conversation while offline) beyond the
normal REST `GET /v1/conversations/:id/messages` fetch the frontend already does on
mount/reconnect — this is sufficient given the frontend always re-fetches on navigation, but a
dedicated `since` cursor for gap-filling is a reasonable future enhancement.

## Error handling

Connection-level failures emit a client-visible `error` event with `{ message: string }` before
disconnecting. Per-event handler errors (e.g. `message:send` to a conversation you're not a
participant in) currently propagate as unhandled promise rejections logged server-side rather than
an explicit error acknowledgment back to that specific emit — client-side, prefer the REST
endpoints when you need a reliable error response for a given action; use the socket primarily for
the fire-and-forget realtime stream.
