import { create } from "zustand";

export interface CallPeer {
  userId: string;
  displayName: string;
  stream: MediaStream | null;
  audioEnabled: boolean;
  videoEnabled: boolean;
}

interface CallState {
  activeConversationId: string | null;
  localStream: MediaStream | null;
  localAudioEnabled: boolean;
  localVideoEnabled: boolean;
  peers: Record<string, CallPeer>;
  incomingCall: { conversationId: string; fromUserId: string } | null;

  setActiveConversationId: (id: string | null) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  toggleLocalAudio: () => void;
  toggleLocalVideo: () => void;
  upsertPeer: (peer: CallPeer) => void;
  removePeer: (userId: string) => void;
  setPeerMediaState: (userId: string, audioEnabled: boolean, videoEnabled: boolean) => void;
  setIncomingCall: (call: { conversationId: string; fromUserId: string } | null) => void;
  reset: () => void;
}

export const useCallStore = create<CallState>((set) => ({
  activeConversationId: null,
  localStream: null,
  localAudioEnabled: true,
  localVideoEnabled: true,
  peers: {},
  incomingCall: null,

  setActiveConversationId: (id) => set({ activeConversationId: id }),
  setLocalStream: (stream) => set({ localStream: stream }),
  toggleLocalAudio: () =>
    set((s) => {
      s.localStream?.getAudioTracks().forEach((t) => (t.enabled = !s.localAudioEnabled));
      return { localAudioEnabled: !s.localAudioEnabled };
    }),
  toggleLocalVideo: () =>
    set((s) => {
      s.localStream?.getVideoTracks().forEach((t) => (t.enabled = !s.localVideoEnabled));
      return { localVideoEnabled: !s.localVideoEnabled };
    }),
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
  setIncomingCall: (call) => set({ incomingCall: call }),
  reset: () =>
    set((s) => {
      s.localStream?.getTracks().forEach((t) => t.stop());
      return {
        activeConversationId: null,
        localStream: null,
        localAudioEnabled: true,
        localVideoEnabled: true,
        peers: {}
      };
    })
}));
