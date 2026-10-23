"use client";

import type { Message, SendMessageInput } from "@messenger/shared-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useServices } from "@/components/providers/ServiceProvider";
import { ApiError } from "@/lib/api/http-client";

type MessagesPage = { messages: Message[]; nextCursor: string | null };

function appendMessageDeduped(old: MessagesPage | undefined, message: Message): MessagesPage {
  if (!old) return { messages: [message], nextCursor: null };
  if (old.messages.some((m) => m.id === message.id)) return old;
  return { ...old, messages: [...old.messages, message] };
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
        old
          ? { ...old, messages: old.messages.map((m) => (m.id === message.id ? message : m)) }
          : old
      );
    });
    return () => {
      unsubscribe();
      unsubscribeDeleted();
    };
  }, [conversationId, chat, queryClient]);

  return query;
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
