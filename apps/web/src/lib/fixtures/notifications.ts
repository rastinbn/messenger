import type { Notification } from "@messenger/shared-types";

export const FIXTURE_NOTIFICATIONS: Notification[] = [
  {
    id: "n-1",
    type: "message",
    title: "Maren Koch",
    body: "sounds good, see you then",
    read: false,
    relatedConversationId: "c-1",
    createdAt: "2026-07-12T08:41:00.000Z"
  },
  {
    id: "n-2",
    type: "mention",
    title: "Launch Squad",
    body: "Theo mentioned you: @you can you confirm the venue?",
    read: false,
    relatedConversationId: "c-4",
    createdAt: "2026-07-11T14:05:00.000Z"
  },
  {
    id: "n-3",
    type: "friend_request",
    title: "Sam Ortega",
    body: "wants to add you as a contact",
    read: true,
    relatedConversationId: null,
    createdAt: "2026-07-10T09:00:00.000Z"
  },
  {
    id: "n-4",
    type: "system",
    title: "Welcome to Messenger",
    body: "Your account was created successfully.",
    read: true,
    relatedConversationId: null,
    createdAt: "2026-06-01T00:00:00.000Z"
  }
];
