import { create } from "zustand";

export interface CallPeer {
  userId: string;
  displayName: string;
  stream: MediaStream | null;
  audioEnabled: boolean;
  videoEnabled: boolean;
}

export type CallStatus = "idle" | "ringing" | "active";

export interface IncomingCall {
  conversationId: string;
  fromUserId: string;
  fromDisplayName?: string;
  video: boolean;
}

interface CallState {
  activeConversationId: string | null;
  /** ringing = we joined but nobody has connected yet; active = at least one peer media connected. */
  status: CallStatus;
  /** Whether the call was started with (or upgraded to) video. */
  isVideoCall: boolean;

  localStream: MediaStream | null;
  localAudioEnabled: boolean;
  localVideoEnabled: boolean;

  peers: Record<string, CallPeer>;
  incomingCall: IncomingCall | null;

  /** Transient user-facing message (call declined, no answer, …). */
  notice: string | null;
  /** Fatal call error (no microphone, signaling failure, …). */
  error: string | null;

  beginCall: (params: { conversationId: string; video: boolean }) => void;
  markActive: () => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setLocalAudioEnabled: (enabled: boolean) => void;
  setLocalVideoEnabled: (enabled: boolean) => void;
  setVideoCall: (isVideo: boolean) => void;
  upsertPeer: (peer: CallPeer) => void;
  removePeer: (userId: string) => void;
  setPeerMediaState: (userId: string, audioEnabled: boolean, videoEnabled: boolean) => void;
  setIncomingCall: (call: IncomingCall | null) => void;
  setNotice: (notice: string | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const IDLE = {
  activeConversationId: null,
  status: "idle" as const,
  isVideoCall: true,
  localStream: null,
  localAudioEnabled: true,
  localVideoEnabled: true,
  peers: {}
};

export const useCallStore = create<CallState>((set) => ({
  ...IDLE,
  incomingCall: null,
  notice: null,
  error: null,

  beginCall: ({ conversationId, video }) =>
    set({
      activeConversationId: conversationId,
      status: "ringing",
      isVideoCall: video,
      localVideoEnabled: video,
      localAudioEnabled: true,
      peers: {},
      error: null,
      notice: null
    }),

  markActive: () => set((s) => (s.status === "active" ? {} : { status: "active" })),

  // Track enabling/disabling lives in the engine (it owns the MediaStream), so
  // these are plain setters rather than toggles that also mutate tracks.
  setLocalStream: (localStream) => set({ localStream }),
  setLocalAudioEnabled: (localAudioEnabled) => set({ localAudioEnabled }),
  setLocalVideoEnabled: (localVideoEnabled) => set({ localVideoEnabled }),
  setVideoCall: (isVideoCall) => set({ isVideoCall }),

  upsertPeer: (peer) => set((s) => ({ peers: { ...s.peers, [peer.userId]: peer } })),
  removePeer: (userId) =>
    set((s) => {
      const next = { ...s.peers };
      delete next[userId];
      return { peers: next };
    }),

  setPeerMediaState: (userId, audioEnabled, videoEnabled) =>
    set((s) => {
      const peer = s.peers[userId];
      if (!peer) return {};
      return { peers: { ...s.peers, [userId]: { ...peer, audioEnabled, videoEnabled } } };
    }),

  setIncomingCall: (incomingCall) => set({ incomingCall }),
  setNotice: (notice) => set({ notice }),
  setError: (error) => set({ error }),

  reset: () =>
    set((s) => {
      s.localStream?.getTracks().forEach((track) => track.stop());
      return { ...IDLE, isVideoCall: true };
    })
}));
