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
  const localStream = useCallStore((s) => s.localStream);
  const localAudioEnabled = useCallStore((s) => s.localAudioEnabled);
  const localVideoEnabled = useCallStore((s) => s.localVideoEnabled);
  const peers = useCallStore((s) => s.peers);
  const { data: currentUser } = useCurrentUser();
  const { leaveCall, toggleAudio, toggleVideo } = useCall();

  if (!activeConversationId) return null;

  const peerList = Object.values(peers);

  return (
    <div className="fixed inset-0 z-40 bg-bg-base/98 flex flex-col p-4 md:p-8">
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
          isLocal
          muted
        />
        {peerList.map((peer) => (
          <VideoTile
            key={peer.userId}
            displayName={peer.displayName}
            stream={peer.stream}
            videoEnabled={peer.videoEnabled}
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
          onClick={toggleVideo}
          aria-label={localVideoEnabled ? "Turn camera off" : "Turn camera on"}
        >
          {localVideoEnabled ? (
            <Video className="h-5 w-5" strokeWidth={1.8} aria-hidden />
          ) : (
            <VideoOff className="h-5 w-5" strokeWidth={1.8} aria-hidden />
          )}
        </Button>
        <Button variant="danger" size="lg" onClick={leaveCall} aria-label="Leave call">
          <span className="flex items-center gap-2">
            <PhoneOff className="h-5 w-5" strokeWidth={1.8} aria-hidden />
            Leave call
          </span>
        </Button>
      </div>
    </div>
  );
}
