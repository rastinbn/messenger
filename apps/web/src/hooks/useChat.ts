"use client";

import type { Message, SendMessageInput } from "@messenger/shared-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";

import { useServices } from "@/components/providers/ServiceProvider";
import { ApiError } from "@/lib/api/http-client";

type MessagesPage = { messages: Message[]; nextCursor: string | null };

function appendMessageDeduped(old: MessagesPage | undefined, message: Message): MessagesPage {
  if (!old) return { messages: [message], nextCursor: null };
  if (old.messages.some((m) => m.id === message.id)) return old;
  return { ...old, messages: [...old.messages, message] };
}

function replaceMessage(old: MessagesPage | undefined, message: Message): MessagesPage | undefined {
  if (!old) return old;
  return {
    ...old,
    messages: old.messages.map((m) => (m.id === message.id ? message : m))
  };
}

/**
 * Don't retry a 403/404 — those mean "you're not a participant" or "this
 * doesn't exist," which retrying can never fix, and retrying just doubles
 * the noise in server logs for something that needs a redirect, not a
 * second attempt.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && (error.statusCode === 403 || error.statusCode === 404)) {
    return false;
  }
  return failureCount < 1;
}

export function useConversations() {
  const { chat } = useServices();
  return useQuery({
    queryKey: ["conversations"],
    queryFn: () => chat.listConversations(),
    refetchInterval: 15_000
  });
}

export function useConversation(conversationId: string | null) {
  const { chat } = useServices();
  return useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => chat.getConversation(conversationId!),
    enabled: !!conversationId,
    retry: shouldRetry
  });
}

export function useMessages(conversationId: string | null) {
  const { chat } = useServices();
  const queryClient = useQueryClient();

  /**
   * Walks older pages until `messageId` is in the cache. Reply quotes can point
   * past the first page, so clicking one must be able to backfill history.
   */
  const ensureMessageLoaded = useCallback(
    async (messageId: string): Promise<boolean> => {
      if (!conversationId) return false;
      const key = ["messages", conversationId];
      const cached = queryClient.getQueryData<MessagesPage>(key);
      if (cached?.messages.some((m) => m.id === messageId)) return true;

      let cursor = cached?.nextCursor ?? null;
      // A runaway cursor would mean a broken API contract; cap the walk so a
      // click can never spin forever.
      for (let pages = 0; pages < 40 && cursor; pages++) {
        const older = await chat.getMessages(conversationId, cursor);
        queryClient.setQueryData<MessagesPage>(key, (old) => {
          if (!old) return older;
          const known = new Set(old.messages.map((m) => m.id));
          return {
            messages: [...older.messages.filter((m) => !known.has(m.id)), ...old.messages],
            nextCursor: older.nextCursor
          };
        });
        if (older.messages.some((m) => m.id === messageId)) return true;
        cursor = older.nextCursor;
      }
      return false;
    },
    [chat, conversationId, queryClient]
  );

  const query = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => chat.getMessages(conversationId!),
    enabled: !!conversationId,
    retry: shouldRetry
  });

  useEffect(() => {
    if (!conversationId) return;
    const unsubscribe = chat.onMessage(conversationId, (message) => {
      queryClient.setQueryData<MessagesPage>(["messages", conversationId], (old) =>
        appendMessageDeduped(old, message)
      );
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });
    // Deletions arrive as the tombstone itself (empty content + deletedAt), so
    // open clients can swap the row in place without refetching the thread.
    const unsubscribeDeleted = chat.onMessageDeleted(conversationId, (message) => {
      queryClient.setQueryData<MessagesPage>(["messages", conversationId], (old) =>
        replaceMessage(old, message)
      );
    });
    // Reactions arrive as a full replacement row over `message:updated`.
    const unsubscribeUpdated = chat.onMessageUpdated(conversationId, (message) => {
      queryClient.setQueryData<MessagesPage>(["messages", conversationId], (old) =>
        replaceMessage(old, message)
      );
    });
    return () => {
      unsubscribe();
      unsubscribeDeleted();
      unsubscribeUpdated();
    };
  }, [conversationId, chat, queryClient]);

  return { ...query, ensureMessageLoaded };
}

export function useTypingIndicator(conversationId: string | null) {
  const { chat } = useServices();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;
    const unsubscribe = chat.onTyping(conversationId, (userId, isTyping) => {
      queryClient.setQueryData(["typing", conversationId], (old: Record<string, boolean> = {}) => ({
        ...old,
        [userId]: isTyping
      }));
    });
    return unsubscribe;
  }, [conversationId, chat, queryClient]);

  return useQuery({
    queryKey: ["typing", conversationId],
    queryFn: () => ({}) as Record<string, boolean>,
    enabled: !!conversationId,
    staleTime: Infinity
  });
}

export function useSendMessage() {
  const { chat } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SendMessageInput) => chat.sendMessage(input),
    onSuccess: (message) => {
      queryClient.setQueryData<MessagesPage>(["messages", message.conversationId], (old) =>
        appendMessageDeduped(old, message)
      );
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  });
}

export function useDeleteMessage() {
  const { chat } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    // `conversationId` is only used to keep the optimistic cache key simple; the
    // API addresses the message directly.
    mutationFn: (input: { messageId: string; conversationId: string }) => chat.deleteMessage(input.messageId),
    onSuccess: (tombstone) => {
      queryClient.setQueryData<MessagesPage>(["messages", tombstone.conversationId], (old) =>
        old
          ? { ...old, messages: old.messages.map((m) => (m.id === tombstone.id ? tombstone : m)) }
          : old
      );
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    retry: false
  });
}

export function useForwardMessage() {
  const { chat } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { messageId: string; conversationId: string }) => chat.forwardMessage(input),
    onSuccess: (forwarded) => {
      queryClient.setQueryData<MessagesPage>(["messages", forwarded.conversationId], (old) =>
        old ? appendMessageDeduped(old, forwarded) : old
      );
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  });
}

/**
 * One mutation for both directions: `emoji: null` removes the caller's current
 * reaction, any other value adds/replaces it. The socket echo is idempotent —
 * both paths replace the same row by id.
 */
export function useReactToMessage() {
  const { chat } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { messageId: string; emoji: string | null }) =>
      input.emoji === null
        ? chat.removeReaction(input.messageId)
        : chat.reactToMessage(input.messageId, input.emoji),
    onSuccess: (message) => {
      queryClient.setQueryData<MessagesPage>(["messages", message.conversationId], (old) =>
        replaceMessage(old, message)
      );
    },
    retry: false
  });
}

export function useMarkRead() {
  const { chat } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => chat.markRead(conversationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations"] }),
    retry: false // same reasoning as shouldRetry above — a mutation-level 403 won't fix itself
  });
}

export function useCreateConversation() {
  const { chat } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ participantIds, name }: { participantIds: string[]; name?: string }) =>
      chat.createConversation(participantIds, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations"] })
  });
}
