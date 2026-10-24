"use client";

import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";

import { VideoTile } from "@/components/call/VideoTile";
import { Button } from "@/components/ui/Button";
import { useCall } from "@/hooks/useCall";
import { useCallStore } from "@/stores/useCallStore";
import { useCurrentUser } from "@/hooks/useUsers";

/**
 * Fullscreen-ish overlay for an active call. Mounted once at the app-shell
 * level (see (app)/layout.tsx) so a call survives navigating between pages
 * within the app.
 */
export function CallOverlay() {
  const activeConversationId = useCallStore((s) => s.activeConversationId);
  const status = useCallStore((s) => s.status);
  const isVideoCall = useCallStore((s) => s.isVideoCall);
  const localStream = useCallStore((s) => s.localStream);
  const localAudioEnabled = useCallStore((s) => s.localAudioEnabled);
  const localVideoEnabled = useCallStore((s) => s.localVideoEnabled);
  const peers = useCallStore((s) => s.peers);
  const { data: currentUser } = useCurrentUser();
  const { leaveCall, toggleAudio, toggleVideo } = useCall();

  if (!activeConversationId) return null;

  const peerList = Object.values(peers);
  const isRinging = status === "ringing" && peerList.length === 0;

  return (
    <div className="fixed inset-0 z-40 bg-bg-base/98 flex flex-col p-4 md:p-8">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg">{isVideoCall ? "Video call" : "Voice call"}</p>
          <p className="text-xs text-text-secondary" role="status">
            {isRinging
              ? "Ringing…"
              : peerList.length > 0
                ? `${peerList.length + 1} on the call`
                : "Connecting…"}
          </p>
        </div>
        <Button variant="danger" size="sm" className="gap-2" onClick={leaveCall}>
          <PhoneOff className="h-4 w-4" aria-hidden />
          Leave
        </Button>
      </div>

      <div
        className="flex-1 grid gap-3 overflow-y-auto"
        style={{
          gridTemplateColumns: `repeat(${Math.min(Math.max(peerList.length + 1, 1), 3)}, minmax(0, 1fr))`
        }}
      >
        <VideoTile
          displayName={currentUser?.displayName ?? "You"}
          stream={localStream}
          videoEnabled={localVideoEnabled}
          audioEnabled={localAudioEnabled}
          isLocal
          muted
        />
        {peerList.map((peer) => (
          <VideoTile
            key={peer.userId}
            displayName={peer.displayName}
            stream={peer.stream}
            videoEnabled={peer.videoEnabled}
            audioEnabled={peer.audioEnabled}
          />
        ))}
      </div>

      <div className="flex items-center justify-center gap-3 pt-4">
        <Button
          variant={localAudioEnabled ? "secondary" : "danger"}
          size="lg"
          onClick={toggleAudio}
          aria-label={localAudioEnabled ? "Mute microphone" : "Unmute microphone"}
        >
          {localAudioEnabled ? (
            <Mic className="h-5 w-5" strokeWidth={1.8} aria-hidden />
          ) : (
            <MicOff className="h-5 w-5" strokeWidth={1.8} aria-hidden />
          )}
        </Button>
        <Button
          variant={localVideoEnabled ? "secondary" : "danger"}
          size="lg"
          onClick={() => void toggleVideo()}
          aria-label={localVideoEnabled ? "Turn camera off" : "Turn camera on"}
        >
          {localVideoEnabled ? (
            <Video className="h-5 w-5" strokeWidth={1.8} aria-hidden />
          ) : (
            <VideoOff className="h-5 w-5" strokeWidth={1.8} aria-hidden />
          )}
        </Button>
      </div>
    </div>
  );
}
