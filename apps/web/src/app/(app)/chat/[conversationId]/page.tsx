"use client";

import type { Message } from "@messenger/shared-types";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ChatWindowHeader } from "@/components/chat/ChatWindowHeader";
import { ForwardMessageModal } from "@/components/chat/ForwardMessageModal";
import { MessageComposer } from "@/components/chat/MessageComposer";
import { MessageList } from "@/components/chat/MessageList";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  useConversation,
  useDeleteMessage,
  useForwardMessage,
  useMarkRead,
  useMessages,
  useSendMessage,
  useTypingIndicator
} from "@/hooks/useChat";
import { useCurrentUser } from "@/hooks/useUsers";
import { useServices } from "@/components/providers/ServiceProvider";
import { ApiError } from "@/lib/api/http-client";
import { useUiStore } from "@/stores/useUiStore";
import { useChatBackground } from "@/stores/useChatBackgroundStore";
import { useLocale } from "@/components/providers/LocaleProvider";

export default function ChatWindowPage() {
  const { t } = useLocale();
  const params = useParams<{ conversationId: string }>();
  const conversationId = params.conversationId;
  const router = useRouter();

  const { chat } = useServices();
  const { data: conversation, isLoading: conversationLoading, error: conversationError } =
    useConversation(conversationId);
  const { data: messagesData, isLoading: messagesLoading } = useMessages(conversationId);
  const { data: typingMap } = useTypingIndicator(conversationId);
  const { data: currentUser } = useCurrentUser();
  const sendMessage = useSendMessage();
  const deleteMessage = useDeleteMessage();
  const forwardMessage = useForwardMessage();
  const markRead = useMarkRead();
  const background = useChatBackground(conversationId);

  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [forwarding, setForwarding] = useState<Message | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Message | null>(null);

  const draft = useUiStore((s) => s.draftsByConversation[conversationId] ?? "");
  const setDraft = useUiStore((s) => s.setDraft);
  const setMobileConversationListOpen = useUiStore((s) => s.setMobileConversationListOpen);

  useEffect(() => {
    setMobileConversationListOpen(false);
  }, [conversationId, setMobileConversationListOpen]);

  useEffect(() => {
    markRead.mutate(conversationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // A draft's reply target belongs to the thread it was started in — don't carry
  // it over when the user switches conversations. Adjusting state during render
  // (rather than in an effect) is React's documented pattern for derived resets.
  const [renderedConversationId, setRenderedConversationId] = useState(conversationId);
  if (renderedConversationId !== conversationId) {
    setRenderedConversationId(conversationId);
    setReplyTo(null);
    setForwarding(null);
    setPendingDelete(null);
  }

  // A 403 here means this conversation either never existed for this user
  // or they've since been removed from it (e.g. after a database reset in
  // dev, or an admin deleting the conversation) — there's nothing to show,
  // so bounce back to the conversation list instead of leaving a dead page up.
  useEffect(() => {
    if (conversationError instanceof ApiError && conversationError.statusCode === 403) {
      router.replace("/chat");
    }
  }, [conversationError, router]);

  if (conversationError instanceof ApiError && conversationError.statusCode === 403) {
    return null;
  }

  if (conversationLoading || !conversation || !currentUser) {
    return (
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="h-16 border-b border-border-subtle p-4">
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="flex-1 min-h-0 p-4 flex flex-col gap-3">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-10 w-1/3 ml-auto" />
        </div>
      </div>
    );
  }

  const typingUserIds = Object.entries(typingMap ?? {})
    .filter(([, isTyping]) => isTyping)
    .map(([userId]) => userId);

  const nameFor = (userId: string) =>
    conversation.participants.find((p) => p.id === userId)?.displayName ??
    (userId === currentUser.id ? t("chat.you") : t("chat.unknown"));

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <ChatWindowHeader conversation={conversation} currentUserId={currentUser.id} />

      <MessageList
        conversationId={conversationId}
        messages={messagesData?.messages ?? []}
        participants={conversation.participants}
        currentUserId={currentUser.id}
        typingUserIds={typingUserIds}
        isLoading={messagesLoading}
        background={background}
        onReply={setReplyTo}
        onForward={setForwarding}
        onDelete={setPendingDelete}
      />

      <MessageComposer
        value={draft}
        onChange={(text) => setDraft(conversationId, text)}
        onTypingChange={(isTyping) => chat.setTyping(conversationId, isTyping)}
        replyTo={
          replyTo
            ? { senderName: nameFor(replyTo.senderId), content: replyTo.content }
            : null
        }
        onCancelReply={() => setReplyTo(null)}
        onSend={(text, attachmentIds) => {
          sendMessage.mutate({
            conversationId,
            content: text,
            attachmentIds: attachmentIds.length ? attachmentIds : undefined,
            replyToId: replyTo?.id
          });
          setDraft(conversationId, "");
          setReplyTo(null);
        }}
      />

      <ForwardMessageModal
        message={forwarding}
        sourceConversationId={conversationId}
        currentUserId={currentUser.id}
        isForwarding={forwardMessage.isPending}
        onClose={() => setForwarding(null)}
        onForward={(targetConversationId) => {
          if (!forwarding) return;
          forwardMessage.mutate(
            { messageId: forwarding.id, conversationId: targetConversationId },
            { onSuccess: () => setForwarding(null) }
          );
        }}
      />

      <Modal
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title={t("message.deleteTitle")}
        size="sm"
      >
        <p className="text-sm text-text-secondary">
          {t("message.deleteHelp")}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setPendingDelete(null)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="danger"
            size="sm"
            isLoading={deleteMessage.isPending}
            onClick={() => {
              if (!pendingDelete) return;
              deleteMessage.mutate(
                { messageId: pendingDelete.id, conversationId },
                { onSuccess: () => setPendingDelete(null) }
              );
            }}
          >
            {t("message.delete")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
