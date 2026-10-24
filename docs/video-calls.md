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

- `call:invite { conversationId, video }` — notify other conversation participants
  a call is starting (they don't need to have joined anything yet). `video` carries
  the call mode so a voice call is answered without turning the camera on.
- `call:join { conversationId }` — join the call's signaling room.
- `call:leave { conversationId }` — leave.
- `call:decline { conversationId, toUserId }` — the callee refuses the call.
- `call:signal { conversationId, toUserId, data }` — relay an opaque WebRTC
  offer/answer/ICE candidate to one specific peer. The server never inspects
  `data`.
- `call:media-state { conversationId, audioEnabled, videoEnabled }` — mute/camera
  toggle broadcast to the room (for UI only, doesn't affect the media itself).

**Server → client:**

- `call:incoming { conversationId, fromUserId, fromDisplayName, video }` — sent to
  each other participant's personal room when someone calls `call:invite`.
- `call:participants { conversationId, participantIds, participants, self }` — sent
  only to the client that just joined, listing who's already in the call and their
  display names. The joining client is responsible for initiating an
  `RTCPeerConnection` + offer toward each of these.
- `call:peer-joined { conversationId, userId, displayName }` — sent to everyone
  already in the room when someone new joins.
- `call:peer-left { conversationId, userId }` — clean up that peer's
  connection.
- `call:signal { conversationId, fromUserId, data }` — the relayed
  offer/answer/ICE candidate.
- `call:media-state { conversationId, userId, audioEnabled, videoEnabled }`.
- `call:ended { conversationId, reason: "declined" | "ended" }` — the call is over
  for everyone: the callee declined, or the last participant left (which also
  releases anyone still ringing).

## Client responsibility (see `apps/web/src/lib/call/callEngine.ts`)

The server does zero WebRTC — everything SDP/ICE-related happens
peer-to-peer in the browser. The client engine is responsible for:
1. Getting local media (`getUserMedia`), falling back to audio-only when the
   camera is unavailable.
2. On `call:participants`, creating an `RTCPeerConnection` + offer for each
   existing participant.
3. On `call:peer-joined`, waiting briefly for the joiner's offer and only
   offering itself if none arrives (covers both sides joining at once).
4. **Buffering ICE candidates** that arrive before the peer connection or its
   remote description exists, then flushing them — dropping them was the main
   reason calls failed to connect outside trivial LAN setups.
5. Handling glare: if an offer arrives while we have a local offer, roll our
   offer back instead of tearing the connection down.
6. Re-negotiating when the camera is switched on mid-call (the track is added and
   every peer gets a fresh offer).
7. On `call:peer-left`/`call:ended`/disconnect, tearing down that peer (or the
   whole call) and removing its tile.
8. A 45 s ring timeout, so a call nobody answers cleans itself up.

## Known limitations (documented, not silently missing)

- **STUN-only connectivity** (see above): behind symmetric NAT/corporate
  firewalls a TURN server is still required; the call otherwise sits at
  "connecting" and times out.
- No call history/persistence — calls are purely ephemeral, in-memory state
  on the API instance handling the signaling. Restarting the API mid-call
  drops everyone (same category of limitation as `PresenceService` before a
  Socket.IO Redis adapter is added — see `docs/deployment.md`).
- No screen sharing yet (same `RTCPeerConnection` plumbing could carry it —
  add a second track type, not a protocol change).
- No recording.
