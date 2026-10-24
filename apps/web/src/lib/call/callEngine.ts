import { getIceServers } from "@/lib/api/ice-servers";
import { getSocket } from "@/lib/api/socket-client";
import { useCallStore } from "@/stores/useCallStore";

interface SignalMessage {
  conversationId: string;
  fromUserId: string;
  data: RTCSessionDescriptionInit | { candidate: RTCIceCandidateInit };
}

/**
 * Module-level singleton — NOT a hook. Every piece of WebRTC state here (peer
 * connections, socket listeners) must exist exactly once for the whole app, no
 * matter how many components want to trigger call actions.
 */
const peerConnections = new Map<string, RTCPeerConnection>();
/**
 * ICE candidates that arrive before their peer connection (or its remote
 * description) exists. Dropping them silently was the main reason calls failed
 * to connect outside of simple LAN setups: candidates are emitted right after
 * setLocalDescription, so they routinely overtake the offer on the wire.
 */
const pendingCandidates = new Map<string, RTCIceCandidateInit[]>();
/** display names learned from signaling, so tiles never show a raw user id. */
const peerNames = new Map<string, string>();
let listenersInitialized = false;
let ringTimeout: ReturnType<typeof setTimeout> | null = null;

const RING_TIMEOUT_MS = 45_000;
/** How long an existing participant waits for the new joiner's offer before offering itself. */
const PEER_JOIN_FALLBACK_MS = 1500;

function emitSignal(conversationId: string, toUserId: string, data: unknown): void {
  getSocket()?.emit("call:signal", { conversationId, toUserId, data });
}

function emitMediaState(): void {
  const { activeConversationId, localAudioEnabled, localVideoEnabled } = useCallStore.getState();
  if (!activeConversationId) return;
  getSocket()?.emit("call:media-state", {
    conversationId: activeConversationId,
    audioEnabled: localAudioEnabled,
    videoEnabled: localVideoEnabled
  });
}

function clearRingTimeout(): void {
  if (ringTimeout) clearTimeout(ringTimeout);
  ringTimeout = null;
}

function startRingTimeout(): void {
  clearRingTimeout();
  ringTimeout = setTimeout(() => {
    const { status, activeConversationId } = useCallStore.getState();
    if (status !== "ringing" || !activeConversationId) return;
    leaveCall();
    useCallStore.getState().setNotice("No answer.");
  }, RING_TIMEOUT_MS);
}

async function flushPendingCandidates(userId: string): Promise<void> {
  const pc = peerConnections.get(userId);
  const queued = pendingCandidates.get(userId);
  if (!pc || !queued?.length) return;

  pendingCandidates.delete(userId);
  for (const candidate of queued) {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn("Discarding ICE candidate", err);
    }
  }
}

async function createPeerConnection(
  conversationId: string,
  remoteUserId: string,
  displayName: string
): Promise<RTCPeerConnection> {
  const existing = peerConnections.get(remoteUserId);
  // Reuse a live connection: renegotiation (adding a camera track) sends a new
  // offer, and rebuilding the peer connection for it would drop the call.
  if (existing && existing.connectionState !== "closed") return existing;

  const iceServers = await getIceServers().catch(() => [] as RTCIceServer[]);
  const pc = new RTCPeerConnection({ iceServers });
  peerConnections.set(remoteUserId, pc);

  const localStream = useCallStore.getState().localStream;
  localStream?.getTracks().forEach((track) => pc.addTrack(track, localStream));

  pc.ontrack = (event) => {
    const store = useCallStore.getState();
    const previous = store.peers[remoteUserId];
    const stream = event.streams[0] ?? previous?.stream ?? null;
    const hasLiveVideo = !!stream?.getVideoTracks().some((track) => track.readyState === "live");

    store.upsertPeer({
      userId: remoteUserId,
      displayName: previous?.displayName ?? displayName,
      stream,
      audioEnabled: previous?.audioEnabled ?? true,
      // Keep the announced media state once we have it; before the first
      // call:media-state, infer it from the tracks that actually arrived.
      videoEnabled: previous?.videoEnabled ?? hasLiveVideo
    });
    store.markActive();
    clearRingTimeout();
  };

  pc.onicecandidate = (event) => {
    if (!event.candidate) return;
    emitSignal(conversationId, remoteUserId, { candidate: event.candidate.toJSON() });
  };

  pc.onconnectionstatechange = () => {
    if (pc.connectionState === "connected") {
      useCallStore.getState().markActive();
      clearRingTimeout();
    } else if (pc.connectionState === "failed") {
      teardownPeer(remoteUserId);
    }
  };

  return pc;
}

function teardownPeer(userId: string): void {
  peerConnections.get(userId)?.close();
  peerConnections.delete(userId);
  pendingCandidates.delete(userId);
  peerNames.delete(userId);
  useCallStore.getState().removePeer(userId);
}

/** Closes every connection and stops local media — no signaling. */
function teardownLocalCall(): void {
  clearRingTimeout();
  peerConnections.forEach((pc) => pc.close());
  peerConnections.clear();
  pendingCandidates.clear();
  peerNames.clear();
  useCallStore.getState().reset();
}

async function createAndOffer(
  conversationId: string,
  remoteUserId: string,
  displayName: string
): Promise<void> {
  const pc = await createPeerConnection(conversationId, remoteUserId, displayName);
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  emitSignal(conversationId, remoteUserId, offer);
}

/** Re-offer after changing local tracks (e.g. turning the camera on mid-call). */
async function renegotiate(remoteUserId: string): Promise<void> {
  const conversationId = useCallStore.getState().activeConversationId;
  const pc = peerConnections.get(remoteUserId);
  if (!conversationId || !pc || pc.signalingState !== "stable") return;

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  emitSignal(conversationId, remoteUserId, offer);
}

function describeMediaError(error: unknown): string {
  const name = (error as DOMException | undefined)?.name;
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Microphone/camera permission was denied.";
    case "NotFoundError":
      return "No microphone or camera was found on this device.";
    case "NotReadableError":
      return "Your microphone/camera is already in use by another app.";
    default:
      return "Could not start your microphone/camera.";
  }
}

async function acquireLocalStream(video: boolean): Promise<{ stream: MediaStream; withVideo: boolean }> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video });
    return { stream, withVideo: video };
  } catch (error) {
    // Asking for a camera that isn't there shouldn't cost you the whole call.
    if (!video) throw error;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    useCallStore.getState().setNotice("Camera unavailable — joined with audio only.");
    return { stream, withVideo: false };
  }
}

/**
 * Registers the socket event listeners exactly once for the lifetime of the
 * app. Safe to call multiple times (e.g. React Strict Mode double-invoking
 * effects in dev) — subsequent calls are no-ops.
 */
export function initCallListeners(): () => void {
  const socket = getSocket();
  if (!socket || listenersInitialized) return () => {};
  listenersInitialized = true;

  async function handleParticipants(payload: {
    conversationId: string;
    participantIds: string[];
    participants?: { userId: string; displayName: string }[];
  }): Promise<void> {
    if (useCallStore.getState().activeConversationId !== payload.conversationId) return;

    const names = new Map((payload.participants ?? []).map((p) => [p.userId, p.displayName]));
    names.forEach((displayName, userId) => peerNames.set(userId, displayName));

    for (const remoteUserId of payload.participantIds) {
      try {
        await createAndOffer(
          payload.conversationId,
          remoteUserId,
          names.get(remoteUserId) ?? remoteUserId
        );
      } catch (error) {
        console.warn("Could not start a peer connection", error);
      }
    }
  }

  function handlePeerJoined(payload: {
    conversationId: string;
    userId: string;
    displayName?: string;
  }): void {
    if (useCallStore.getState().activeConversationId !== payload.conversationId) return;
    if (payload.displayName) peerNames.set(payload.userId, payload.displayName);

    // Glare-avoidance rule: the *new* joiner offers, existing participants wait.
    // If both sides joined at the same instant neither gets a participant list,
    // so fall back to offering ourselves when nothing arrives shortly after.
    setTimeout(() => {
      const state = useCallStore.getState();
      if (state.activeConversationId !== payload.conversationId) return;
      if (peerConnections.has(payload.userId)) return;
      void createAndOffer(
        payload.conversationId,
        payload.userId,
        payload.displayName ?? payload.userId
      ).catch((error) => console.warn("Could not start a peer connection", error));
    }, PEER_JOIN_FALLBACK_MS);
  }

  async function handleSignal(payload: SignalMessage): Promise<void> {
    const state = useCallStore.getState();
    if (!state.activeConversationId || payload.conversationId !== state.activeConversationId) return;

    const peerId = payload.fromUserId;
    const data = payload.data;

    try {
      if ("type" in data && (data.type === "offer" || data.type === "answer")) {
        if (data.type === "offer") {
          const pc = await createPeerConnection(
            payload.conversationId,
            peerId,
            peerNames.get(peerId) ?? peerId
          );

          // Glare: both sides offered. Roll our own offer back and take theirs.
          if (pc.signalingState === "have-local-offer") {
            await pc.setLocalDescription({ type: "rollback" } as RTCSessionDescriptionInit);
          }

          await pc.setRemoteDescription(new RTCSessionDescription(data));
          await flushPendingCandidates(peerId);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          emitSignal(payload.conversationId, peerId, answer);
        } else {
          const pc = peerConnections.get(peerId);
          if (!pc) return;
          // Ignore duplicate/stale answers instead of throwing "wrong state".
          if (pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(data));
            await flushPendingCandidates(peerId);
          }
        }
      } else if ("candidate" in data) {
        const pc = peerConnections.get(peerId);
        if (pc?.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } else {
          const queue = pendingCandidates.get(peerId) ?? [];
          queue.push(data.candidate);
          pendingCandidates.set(peerId, queue);
        }
      }
    } catch (error) {
      console.warn("Call signaling error", error);
    }
  }

  function handlePeerLeft(payload: { conversationId: string; userId: string }): void {
    teardownPeer(payload.userId);
  }

  function handleIncoming(payload: {
    conversationId: string;
    fromUserId: string;
    fromDisplayName?: string;
    video?: boolean;
  }): void {
    // Don't surface a call invite while already on a call.
    if (useCallStore.getState().activeConversationId) return;
    useCallStore.getState().setIncomingCall({
      conversationId: payload.conversationId,
      fromUserId: payload.fromUserId,
      fromDisplayName: payload.fromDisplayName,
      video: payload.video ?? true
    });
  }

  function handleMediaState(payload: {
    conversationId: string;
    userId: string;
    audioEnabled: boolean;
    videoEnabled: boolean;
  }): void {
    useCallStore.getState().setPeerMediaState(payload.userId, payload.audioEnabled, payload.videoEnabled);
  }

  function handleCallEnded(payload: { conversationId: string; reason?: string }): void {
    const state = useCallStore.getState();
    const notice = payload.reason === "declined" ? "Call declined." : "Call ended.";

    if (state.activeConversationId === payload.conversationId) {
      teardownLocalCall();
      useCallStore.getState().setNotice(notice);
    } else if (state.incomingCall?.conversationId === payload.conversationId) {
      state.setIncomingCall(null);
      state.setNotice(notice);
    }
  }

  socket.on("call:participants", handleParticipants);
  socket.on("call:peer-joined", handlePeerJoined);
  socket.on("call:signal", handleSignal);
  socket.on("call:peer-left", handlePeerLeft);
  socket.on("call:incoming", handleIncoming);
  socket.on("call:media-state", handleMediaState);
  socket.on("call:ended", handleCallEnded);

  return () => {
    socket.off("call:participants", handleParticipants);
    socket.off("call:peer-joined", handlePeerJoined);
    socket.off("call:signal", handleSignal);
    socket.off("call:peer-left", handlePeerLeft);
    socket.off("call:incoming", handleIncoming);
    socket.off("call:media-state", handleMediaState);
    socket.off("call:ended", handleCallEnded);
    listenersInitialized = false;
  };
}

/** Resolves false when local media could not be acquired (the store carries the reason). */
export async function joinCall(conversationId: string, video: boolean): Promise<boolean> {
  const socket = getSocket();
  if (!socket) {
    useCallStore.getState().setError("Not connected — reload the page and try again.");
    return false;
  }

  // Joining a second call must not leak the first one's peers or camera.
  if (useCallStore.getState().activeConversationId) leaveCall();

  let stream: MediaStream;
  let withVideo: boolean;
  try {
    ({ stream, withVideo } = await acquireLocalStream(video));
  } catch (error) {
    useCallStore.getState().setError(describeMediaError(error));
    return false;
  }

  useCallStore.getState().setLocalStream(stream);
  useCallStore.getState().beginCall({ conversationId, video: withVideo });
  startRingTimeout();
  socket.emit("call:join", { conversationId });
  return true;
}

export async function answerCall(): Promise<void> {
  const incoming = useCallStore.getState().incomingCall;
  if (!incoming) return;
  useCallStore.getState().setIncomingCall(null);
  // Answer with the same mode the call was started in (a voice call must not
  // turn the callee's camera on).
  await joinCall(incoming.conversationId, incoming.video);
}

export function declineCall(): void {
  const incoming = useCallStore.getState().incomingCall;
  if (!incoming) return;
  getSocket()?.emit("call:decline", {
    conversationId: incoming.conversationId,
    toUserId: incoming.fromUserId
  });
  useCallStore.getState().setIncomingCall(null);
}

export function leaveCall(): void {
  const conversationId = useCallStore.getState().activeConversationId;
  if (conversationId) getSocket()?.emit("call:leave", { conversationId });
  teardownLocalCall();
}

export function inviteToCall(conversationId: string, video: boolean): void {
  getSocket()?.emit("call:invite", { conversationId, video });
}

export function toggleAudio(): void {
  const state = useCallStore.getState();
  if (!state.localStream) return;

  const next = !state.localAudioEnabled;
  state.localStream.getAudioTracks().forEach((track) => (track.enabled = next));
  state.setLocalAudioEnabled(next);
  emitMediaState();
}

export async function toggleVideo(): Promise<void> {
  const state = useCallStore.getState();
  if (!state.localStream) return;

  const videoTracks = state.localStream.getVideoTracks();

  // Voice call → turning the camera on means acquiring a new track and
  // renegotiating every peer; flipping `.enabled` on a track that doesn't
  // exist was a silent no-op before.
  if (videoTracks.length === 0) {
    if (state.localVideoEnabled) return;
    try {
      const camera = await navigator.mediaDevices.getUserMedia({ video: true });
      const track = camera.getVideoTracks()[0];
      if (!track) return;

      state.localStream.addTrack(track);
      state.setLocalVideoEnabled(true);
      state.setVideoCall(true);

      for (const [userId, pc] of peerConnections) {
        if (pc.connectionState === "closed") continue;
        pc.addTrack(track, state.localStream);
        await renegotiate(userId).catch((error) => console.warn("Could not renegotiate", error));
      }
      emitMediaState();
    } catch (error) {
      state.setError(describeMediaError(error));
    }
    return;
  }

  const next = !state.localVideoEnabled;
  videoTracks.forEach((track) => (track.enabled = next));
  state.setLocalVideoEnabled(next);
  emitMediaState();
}
