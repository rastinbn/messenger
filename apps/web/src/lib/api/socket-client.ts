import { io, type Socket } from "socket.io-client";

import { API_BASE_URL } from "./http-client";
import { tokenStorage } from "./token-storage";

let socket: Socket | null = null;

/**
 * Lazily creates a single shared Socket.IO connection for the whole app,
 * authenticated via the current access token (see docs/socket-protocol.md).
 * Re-used across every HttpChatService call site rather than one socket per
 * open conversation.
 */
export function getSocket(): Socket | null {
  if (typeof window === "undefined") return null;

  const stored = tokenStorage.load();
  if (!stored) return null;

  if (socket && socket.connected) return socket;

  if (!socket) {
    socket = io(API_BASE_URL, {
      auth: { token: stored.accessToken },
      autoConnect: true,
      reconnection: true
    });
  } else {
    // Token may have rotated since the socket was created (e.g. after a
    // refresh) — update the handshake auth payload before reconnecting.
    socket.auth = { token: stored.accessToken };
    socket.connect();
  }

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
