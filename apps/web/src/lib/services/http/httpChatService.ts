import type { Conversation, Message, SendMessageInput } from "@messenger/shared-types";

import { apiFetch } from "@/lib/api/http-client";
import { getSocket } from "@/lib/api/socket-client";
import type { ChatService } from "@/lib/services/types";

export class HttpChatService implements ChatService {
  async listConversations(): Promise<Conversation[]> {
    return apiFetch<Conversation[]>("/v1/conversations");
  }

  async getConversation(conversationId: string): Promise<Conversation | null> {
    try {
      return await apiFetch<Conversation>(`/v1/conversations/${conversationId}`);
    } catch {
      return null;
    }
  }

  async getMessages(
    conversationId: string,
    cursor?: string
  ): Promise<{ messages: Message[]; nextCursor: string | null }> {
    const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    return apiFetch(`/v1/conversations/${conversationId}/messages${query}`);
  }

  async sendMessage(input: SendMessageInput): Promise<Message> {
    // Sent over REST for a reliable request/response with proper error
    // handling; the API broadcasts the result over the socket to everyone
    // in the room (including this client's own other tabs) — see
    // docs/socket-protocol.md for why REST-sent and socket-sent messages
    // are delivered identically. We don't also emit `message:send` here to
    // avoid double-sending the same message.
    return apiFetch<Message>(`/v1/conversations/${input.conversationId}/messages`, {
      method: "POST",
      body: {
        content: input.content,
        attachmentIds: input.attachmentIds,
        replyToId: input.replyToId
      }
    });
  }

  async deleteMessage(messageId: string): Promise<Message> {
    return apiFetch<Message>(`/v1/messages/${messageId}`, { method: "DELETE" });
  }

  async forwardMessage(input: { messageId: string; conversationId: string }): Promise<Message> {
    return apiFetch<Message>(`/v1/messages/${input.messageId}/forward`, {
      method: "POST",
      body: { conversationId: input.conversationId }
    });
  }

  async markRead(conversationId: string): Promise<void> {
    await apiFetch(`/v1/conversations/${conversationId}/read`, { method: "PUT" });
  }

  async createConversation(participantIds: string[], name?: string): Promise<Conversation> {
    return apiFetch<Conversation>("/v1/conversations", {
      method: "POST",
      body: { participantIds, name }
    });
  }

  setTyping(conversationId: string, isTyping: boolean): void {
    const socket = getSocket();
    socket?.emit(isTyping ? "typing:start" : "typing:stop", { conversationId });
  }

  onTyping(conversationId: string, cb: (userId: string, isTyping: boolean) => void): () => void {
    const socket = getSocket();
    if (!socket) return () => {};

    const handler = (payload: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (payload.conversationId === conversationId) cb(payload.userId, payload.isTyping);
    };
    socket.on("typing:update", handler);
    return () => socket.off("typing:update", handler);
  }

  onMessage(conversationId: string, cb: (message: Message) => void): () => void {
    const socket = getSocket();
    if (!socket) return () => {};

    const handler = (message: Message) => {
      if (message.conversationId === conversationId) cb(message);
    };
    socket.on("message:new", handler);
    return () => socket.off("message:new", handler);
  }

  onMessageDeleted(conversationId: string, cb: (message: Message) => void): () => void {
    const socket = getSocket();
    if (!socket) return () => {};

    const handler = (message: Message) => {
      if (message.conversationId === conversationId) cb(message);
    };
    socket.on("message:deleted", handler);
    return () => socket.off("message:deleted", handler);
  }
}
