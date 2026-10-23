"use client";

import {
  inviteToCall,
  joinCall,
  leaveCall,
  toggleAudio,
  toggleVideo
} from "@/lib/call/callEngine";

/**
 * Thin hook wrapper around the call engine singleton (lib/call/callEngine.ts).
 * Safe to call from as many components as you like — unlike the socket
 * listener setup (which must happen exactly once, see CallProvider), these
 * are just stateless action dispatchers.
 */
export function useCall() {
  return { joinCall, leaveCall, inviteToCall, toggleAudio, toggleVideo };
}
