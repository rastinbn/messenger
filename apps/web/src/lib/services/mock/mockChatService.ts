import type { Conversation, Message, SendMessageInput } from "@messenger/shared-types";

import { FIXTURE_CONVERSATIONS, FIXTURE_MESSAGES } from "@/lib/fixtures/conversations";
import { CURRENT_USER_ID } from "@/lib/fixtures/users";
import type { ChatService } from "@/lib/services/types";

import { delay, uuid } from "./util";

// In-memory mutable store — simulates a backend for the lifetime of the tab.
const conversations = FIXTURE_CONVERSATIONS.map((c) => ({ ...c }));
const messagesByConversation: Record<string, Message[]> = Object.fromEntries(
  Object.entries(FIXTURE_MESSAGES).map(([k, v]) => [k, v.map((m) => ({ ...m }))])
);

type MessageListener = (message: Message) => void;
type TypingListener = (userId: string, isTyping: boolean) => void;

const messageListeners = new Map<string, Set<MessageListener>>();
const deletedListeners = new Map<string, Set<MessageListener>>();
const typingListeners = new Map<string, Set<TypingListener>>();

function emitMessage(conversationId: string, message: Message) {
  messageListeners.get(conversationId)?.forEach((cb) => cb(message));
}

function emitDeleted(conversationId: string, message: Message) {
  deletedListeners.get(conversationId)?.forEach((cb) => cb(message));
}

function emitTyping(conversationId: string, userId: string, isTyping: boolean) {
  typingListeners.get(conversationId)?.forEach((cb) => cb(userId, isTyping));
}

/** Picks a plausible "other participant" to simulate a reply, for demo liveliness. */
function pickReplyAuthor(conversation: Conversation): string | null {
  const others = conversation.participants.filter((p) => p.id !== CURRENT_USER_ID);
  if (others.length === 0) return null;
  return others[Math.floor(Math.random() * others.length)].id;
}

const CANNED_REPLIES = [
  "got it, thanks!",
  "sounds good to me",
  "let me check and get back to you",
  "yep, agreed",
  "haha true",
  "can do"
];

export class MockChatService implements ChatService {
  async listConversations(): Promise<Conversation[]> {
    await delay();
    return [...conversations].sort(
      (a, b) => new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime()
    );
  }

  async getConversation(conversationId: string): Promise<Conversation | null> {
    await delay(150);
    return conversations.find((c) => c.id === conversationId) ?? null;
  }

  async getMessages(
    conversationId: string,
    _cursor?: string
  ): Promise<{ messages: Message[]; nextCursor: string | null }> {
    await delay();
    void _cursor;
    const messages = messagesByConversation[conversationId] ?? [];
    return { messages, nextCursor: null };
  }

  async sendMessage(input: SendMessageInput): Promise<Message> {
    await delay(200);
    if (!messagesByConversation[input.conversationId]) {
      messagesByConversation[input.conversationId] = [];
    }
    const quoted = input.replyToId
      ? messagesByConversation[input.conversationId].find((m) => m.id === input.replyToId)
      : undefined;

    const message: Message = {
      id: uuid(),
      conversationId: input.conversationId,
      senderId: CURRENT_USER_ID,
      content: input.content,
      attachments: [],
      status: "sent",
      editedAt: null,
      createdAt: new Date().toISOString(),
      replyTo: quoted
        ? {
            id: quoted.id,
            senderId: quoted.senderId,
            senderName: quoted.senderId === CURRENT_USER_ID ? "You" : "Them",
            content: quoted.content,
            deletedAt: quoted.deletedAt
          }
        : null,
      forwarded: false,
      deletedAt: null
    };
    messagesByConversation[input.conversationId].push(message);

    const conv = conversations.find((c) => c.id === input.conversationId);
    if (conv) {
      conv.lastMessagePreview = `you: ${input.content}`;
      conv.lastMessageAt = message.createdAt;
    }

    // Simulate a reply arriving after a short beat, to demonstrate realtime
    // wiring (typing indicator -> message) without a real backend.
    if (conv) {
      const replyAuthor = pickReplyAuthor(conv);
      if (replyAuthor && Math.random() < 0.6) {
        setTimeout(() => {
          emitTyping(input.conversationId, replyAuthor, true);
        }, 600);
        setTimeout(() => {
          emitTyping(input.conversationId, replyAuthor, false);
          const reply: Message = {
            id: uuid(),
            conversationId: input.conversationId,
            senderId: replyAuthor,
            content: CANNED_REPLIES[Math.floor(Math.random() * CANNED_REPLIES.length)],
            attachments: [],
            status: "delivered",
            editedAt: null,
            createdAt: new Date().toISOString(),
            replyTo: null,
            forwarded: false,
            deletedAt: null
          };
          messagesByConversation[input.conversationId].push(reply);
          if (conv) {
            conv.lastMessagePreview = reply.content;
            conv.lastMessageAt = reply.createdAt;
            conv.unreadCount += 1;
          }
          emitMessage(input.conversationId, reply);
        }, 2200);
      }
    }

    return message;
  }

  async deleteMessage(messageId: string): Promise<Message> {
    await delay(150);
    for (const [conversationId, list] of Object.entries(messagesByConversation)) {
      const index = list.findIndex((m) => m.id === messageId);
      if (index === -1) continue;
      const tombstone: Message = {
        ...list[index],
        content: "",
        attachments: [],
        deletedAt: new Date().toISOString()
      };
      list[index] = tombstone;
      emitDeleted(conversationId, tombstone);
      return tombstone;
    }
    throw new Error("Message not found.");
  }

  async forwardMessage(input: { messageId: string; conversationId: string }): Promise<Message> {
    await delay(200);
    const source = Object.values(messagesByConversation)
      .flat()
      .find((m) => m.id === input.messageId);
    if (!source) throw new Error("Message not found.");

    const forwarded: Message = {
      ...source,
      id: uuid(),
      conversationId: input.conversationId,
      senderId: CURRENT_USER_ID,
      forwarded: true,
      replyTo: null,
      createdAt: new Date().toISOString(),
      status: "sent"
    };
    if (!messagesByConversation[input.conversationId]) {
      messagesByConversation[input.conversationId] = [];
    }
    messagesByConversation[input.conversationId].push(forwarded);
    emitMessage(input.conversationId, forwarded);
    return forwarded;
  }

  async markRead(conversationId: string): Promise<void> {
    await delay(100);
    const conv = conversations.find((c) => c.id === conversationId);
    if (conv) conv.unreadCount = 0;
  }

  async createConversation(participantIds: string[], name?: string): Promise<Conversation> {
    await delay(300);
    const conv: Conversation = {
      id: uuid(),
      type: participantIds.length > 1 ? "group" : "direct",
      name: name ?? null,
      avatarUrl: null,
      participants: [],
      lastMessagePreview: null,
      lastMessageAt: null,
      unreadCount: 0,
      createdAt: new Date().toISOString()
    };
    conversations.unshift(conv);
    messagesByConversation[conv.id] = [];
    return conv;
  }

  setTyping(conversationId: string, isTyping: boolean): void {
    // Simulated locally-originated typing broadcast (would go over the
    // socket in Phase 2). No-op for the mock's own listeners since the
    // current user doesn't listen to their own typing state.
    void conversationId;
    void isTyping;
  }

  onTyping(conversationId: string, cb: TypingListener): () => void {
    if (!typingListeners.has(conversationId)) typingListeners.set(conversationId, new Set());
    typingListeners.get(conversationId)!.add(cb);
    return () => typingListeners.get(conversationId)?.delete(cb);
  }

  onMessage(conversationId: string, cb: MessageListener): () => void {
    if (!messageListeners.has(conversationId)) messageListeners.set(conversationId, new Set());
    messageListeners.get(conversationId)!.add(cb);
    return () => messageListeners.get(conversationId)?.delete(cb);
  }

  onMessageDeleted(conversationId: string, cb: MessageListener): () => void {
    if (!deletedListeners.has(conversationId)) deletedListeners.set(conversationId, new Set());
    deletedListeners.get(conversationId)!.add(cb);
    return () => deletedListeners.get(conversationId)?.delete(cb);
  }
}
