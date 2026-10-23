# Video Calls

WebRTC, mesh topology (every participant connects directly to every other
participant — the server only relays signaling messages, never touches
media). Implementation: `apps/api/src/modules/calls/interface/ws/calls.gateway.ts`,
same default Socket.IO namespace as the messaging gateway, distinct event
names (`call:*`).

## Why mesh, and its limit

Mesh needs no media server (SFU/MCU) — every browser sends its own upload
stream to every other participant directly. That's simple and cheap, but
upload bandwidth scales with participant count (N-1 outgoing streams per
person), so it degrades badly past roughly 4-6 people. Scaling further
requires a media server (e.g. mediasoup, LiveKit, Janus) doing selective
forwarding — a real infrastructure addition, not a config change, and a
deliberate non-goal for this version.

## Connectivity: STUN only

`GET /v1/calls/ice-servers` returns the configured ICE servers (default:
Google's public STUN, `STUN_URLS` env var). STUN alone gets two peers
connected directly in most home/office network setups. It **fails** behind
some symmetric NATs / restrictive corporate firewalls, where a TURN server
(which relays media when a direct connection can't be established) is
required. Adding TURN later is just adding another entry to `STUN_URLS`
(really should be renamed `ICE_SERVERS` if TURN is added) with
username/credential fields — no protocol change needed on either end.

## Event protocol

**Client → server:**

- `call:invite { conversationId }` — notify other conversation participants
  a call is starting (they don't need to have joined anything yet).
- `call:join { conversationId }` — join the call's signaling room.
- `call:leave { conversationId }` — leave.
- `call:signal { conversationId, toUserId, data }` — relay an opaque WebRTC
  offer/answer/ICE candidate to one specific peer. The server never inspects
  `data`.
- `call:media-state { conversationId, audioEnabled, videoEnabled }` — mute/camera
  toggle broadcast to the room (for UI only, doesn't affect the media itself).

**Server → client:**

- `call:incoming { conversationId, fromUserId }` — sent to each other
  participant's personal room when someone calls `call:invite`.
- `call:participants { conversationId, participantIds }` — sent only to the
  client that just joined, listing who's already in the call. The joining
  client is responsible for initiating an `RTCPeerConnection` + offer toward
  each of these.
- `call:peer-joined { conversationId, userId }` — sent to everyone already in
  the room when someone new joins. Existing participants initiate their own
  offer toward the new joiner (so every pair ends up with exactly one
  offerer, avoiding glare).
- `call:peer-left { conversationId, userId }` — clean up that peer's
  connection.
- `call:signal { conversationId, fromUserId, data }` — the relayed
  offer/answer/ICE candidate.
- `call:media-state { conversationId, userId, audioEnabled, videoEnabled }`.

## Client responsibility (see `apps/web/src/hooks/useCall.ts`)

The server does zero WebRTC — everything SDP/ICE-related happens
peer-to-peer in the browser. The client hook is responsible for:
1. Getting local media (`getUserMedia`).
2. On `call:participants`, creating an `RTCPeerConnection` + offer for each
   existing participant.
3. On `call:peer-joined`, creating an `RTCPeerConnection` and waiting for
   their offer (per the glare-avoidance rule above — the *existing*
   participant offers to the *new* one).
4. Relaying local ICE candidates via `call:signal` as they're discovered.
5. On `call:peer-left`/disconnect, tearing down that specific
   `RTCPeerConnection` and removing its video tile.

## Known limitations (documented, not silently missing)

- No call history/persistence — calls are purely ephemeral, in-memory state
  on the API instance handling the signaling. Restarting the API mid-call
  drops everyone (same category of limitation as `PresenceService` before a
  Socket.IO Redis adapter is added — see `docs/deployment.md`).
- No ringing/decline UX beyond the raw `call:incoming` event — the frontend
  decides how to present that (toast, banner, ringtone).
- No screen sharing yet (same `RTCPeerConnection` plumbing could carry it —
  add a second track type, not a protocol change).
- No recording.
