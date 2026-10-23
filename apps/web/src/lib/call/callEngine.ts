import { getIceServers } from "@/lib/api/ice-servers";
import { getSocket } from "@/lib/api/socket-client";
import { useCallStore } from "@/stores/useCallStore";

interface SignalMessage {
  conversationId: string;
  fromUserId: string;
  data: RTCSessionDescriptionInit | { candidate: RTCIceCandidateInit };
}

/**
 * Module-level singleton — NOT a hook. This is deliberate: every piece of
 * WebRTC state here (peer connections, socket listeners) must exist exactly
 * once for the whole app, no matter how many components want to trigger
 * call actions (ChatWindowHeader, CallProvider, etc.).
 *
 * Bug this fixes: when this logic lived inside a plain hook (`useCall`),
 * every component that called the hook got its OWN independent
 * `peerConnections` Map and its OWN socket listeners. Two mounted instances
 * meant every offer/answer got processed twice, against two different
 * RTCPeerConnection objects for the same remote user — producing
 * `setLocalDescription` "wrong state: stable" errors from the second,
 * now-stale negotiation attempt. Singleton + explicit one-time init fixes
 * this at the root instead of papering over the symptom.
 */
const peerConnections = new Map<string, RTCPeerConnection>();
let listenersInitialized = false;

async function createPeerConnection(
  conversationId: string,
  remoteUserId: string,
  displayName: string
): Promise<RTCPeerConnection> {
  // If one already exists for this peer (e.g. a stale entry from a call
  // that ended without a clean `call:peer-left`), tear it down first rather
  // than layering a second negotiation on top of it.
  const existing = peerConnections.get(remoteUserId);
  if (existing) {
    existing.close();
    peerConnections.delete(remoteUserId);
  }

  const iceServers = await getIceServers();
  const pc = new RTCPeerConnection({ iceServers });
  peerConnections.set(remoteUserId, pc);

  const localStream = useCallStore.getState().localStream;
  localStream?.getTracks().forEach((track) => pc.addTrack(track, localStream));

  pc.ontrack = (event) => {
    useCallStore.getState().upsertPeer({
      userId: remoteUserId,
      displayName,
      stream: event.streams[0] ?? null,
      audioEnabled: true,
      videoEnabled: true
    });
  };

  pc.onicecandidate = (event) => {
    if (!event.candidate) return;
    getSocket()?.emit("call:signal", {
      conversationId,
      toUserId: remoteUserId,
      data: { candidate: event.candidate.toJSON() }
    });
  };

  pc.onconnectionstatechange = () => {
    if (pc.connectionState === "failed" || pc.connectionState === "closed") {
      teardownPeer(remoteUserId);
    }
  };

  return pc;
}

function teardownPeer(userId: string): void {
  peerConnections.get(userId)?.close();
  peerConnections.delete(userId);
  useCallStore.getState().removePeer(userId);
}

async function startLocalMedia(video: boolean): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video });
  useCallStore.getState().setLocalStream(stream);
  return stream;
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

  async function handleParticipants(payload: { conversationId: string; participantIds: string[] }) {
    for (const remoteUserId of payload.participantIds) {
      const pc = await createPeerConnection(payload.conversationId, remoteUserId, remoteUserId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      getSocket()?.emit("call:signal", {
        conversationId: payload.conversationId,
        toUserId: remoteUserId,
        data: offer
      });
    }
  }

  function handlePeerJoined(_payload: { conversationId: string; userId: string }) {
    // Per the glare-avoidance rule (docs/video-calls.md), the *existing*
    // participant does NOT initiate here — we wait for their offer instead.
    void _payload;
  }

  async function handleSignal(payload: SignalMessage) {
    const conversationId = useCallStore.getState().activeConversationId;
    if (!conversationId || payload.conversationId !== conversationId) return;

    const data = payload.data;

    if ("type" in data && data.type === "offer") {
      const pc = await createPeerConnection(payload.conversationId, payload.fromUserId, payload.fromUserId);
      await pc.setRemoteDescription(new RTCSessionDescription(data));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      getSocket()?.emit("call:signal", {
        conversationId: payload.conversationId,
        toUserId: payload.fromUserId,
        data: answer
      });
    } else if ("type" in data && data.type === "answer") {
      const pc = peerConnections.get(payload.fromUserId);
      // Guard against a stray/duplicate answer arriving after the connection
      // is already negotiated — applying it twice is exactly the bug class
      // this file exists to prevent.
      if (pc && pc.signalingState === "have-local-offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(data));
      }
    } else if ("candidate" in data) {
      const pc = peerConnections.get(payload.fromUserId);
      await pc?.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  }

  function handlePeerLeft(payload: { conversationId: string; userId: string }) {
    teardownPeer(payload.userId);
  }

  function handleIncoming(payload: { conversationId: string; fromUserId: string }) {
    useCallStore.getState().setIncomingCall(payload);
  }

  function handleMediaState(payload: {
    conversationId: string;
    userId: string;
    audioEnabled: boolean;
    videoEnabled: boolean;
  }) {
    useCallStore.getState().setPeerMediaState(payload.userId, payload.audioEnabled, payload.videoEnabled);
  }

  socket.on("call:participants", handleParticipants);
  socket.on("call:peer-joined", handlePeerJoined);
  socket.on("call:signal", handleSignal);
  socket.on("call:peer-left", handlePeerLeft);
  socket.on("call:incoming", handleIncoming);
  socket.on("call:media-state", handleMediaState);

  return () => {
    socket.off("call:participants", handleParticipants);
    socket.off("call:peer-joined", handlePeerJoined);
    socket.off("call:signal", handleSignal);
    socket.off("call:peer-left", handlePeerLeft);
    socket.off("call:incoming", handleIncoming);
    socket.off("call:media-state", handleMediaState);
    listenersInitialized = false;
  };
}

export async function joinCall(conversationId: string, video: boolean): Promise<void> {
  await startLocalMedia(video);
  useCallStore.getState().setActiveConversationId(conversationId);
  getSocket()?.emit("call:join", { conversationId });
}

export function leaveCall(): void {
  const conversationId = useCallStore.getState().activeConversationId;
  if (conversationId) getSocket()?.emit("call:leave", { conversationId });
  peerConnections.forEach((pc) => pc.close());
  peerConnections.clear();
  useCallStore.getState().reset();
}

export function inviteToCall(conversationId: string): void {
  getSocket()?.emit("call:invite", { conversationId });
}

export function toggleAudio(): void {
  useCallStore.getState().toggleLocalAudio();
  const { activeConversationId, localAudioEnabled, localVideoEnabled } = useCallStore.getState();
  if (activeConversationId) {
    getSocket()?.emit("call:media-state", {
      conversationId: activeConversationId,
      audioEnabled: localAudioEnabled,
      videoEnabled: localVideoEnabled
    });
  }
}

export function toggleVideo(): void {
  useCallStore.getState().toggleLocalVideo();
  const { activeConversationId, localAudioEnabled, localVideoEnabled } = useCallStore.getState();
  if (activeConversationId) {
    getSocket()?.emit("call:media-state", {
      conversationId: activeConversationId,
      audioEnabled: localAudioEnabled,
      videoEnabled: localVideoEnabled
    });
  }
}
