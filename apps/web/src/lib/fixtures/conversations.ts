import type { Conversation, Message } from "@messenger/shared-types";

import { CURRENT_USER_ID, FIXTURE_USERS, findUser, toPublicUser } from "./users";

const u = (id: string) => toPublicUser(findUser(id)!);

export const FIXTURE_CONVERSATIONS: Conversation[] = [
  {
    id: "c-1",
    type: "direct",
    name: null,
    avatarUrl: null,
    participants: [u(CURRENT_USER_ID), u("u-1")],
    lastMessagePreview: "sounds good, see you then",
    lastMessageAt: "2026-07-12T08:41:00.000Z",
    unreadCount: 2,
    createdAt: "2026-06-01T00:00:00.000Z"
  },
  {
    id: "c-2",
    type: "group",
    name: "Design Weekly",
    avatarUrl: null,
    participants: [u(CURRENT_USER_ID), u("u-2"), u("u-3"), u("u-5")],
    lastMessagePreview: "Priya: pushed the new frames",
    lastMessageAt: "2026-07-12T07:55:00.000Z",
    unreadCount: 0,
    createdAt: "2026-05-20T00:00:00.000Z"
  },
  {
    id: "c-3",
    type: "direct",
    name: null,
    avatarUrl: null,
    participants: [u(CURRENT_USER_ID), u("u-4")],
    lastMessagePreview: "you: thanks, appreciate it",
    lastMessageAt: "2026-07-11T19:12:00.000Z",
    unreadCount: 0,
    createdAt: "2026-04-01T00:00:00.000Z"
  },
  {
    id: "c-4",
    type: "group",
    name: "Launch Squad",
    avatarUrl: null,
    participants: [u(CURRENT_USER_ID), u("u-1"), u("u-2"), u("u-3"), u("u-6")],
    lastMessagePreview: "Theo: can we push the demo to 3pm?",
    lastMessageAt: "2026-07-11T14:03:00.000Z",
    unreadCount: 5,
    createdAt: "2026-03-15T00:00:00.000Z"
  },
  {
    id: "c-5",
    type: "direct",
    name: null,
    avatarUrl: null,
    participants: [u(CURRENT_USER_ID), u("u-5")],
    lastMessagePreview: "lol yes exactly",
    lastMessageAt: "2026-07-10T21:30:00.000Z",
    unreadCount: 0,
    createdAt: "2026-02-01T00:00:00.000Z"
  }
];

// Fixture messages predate replies/forwards, so the new fields are filled in
// here instead of being repeated on every literal below.
const BASE_MESSAGES: Record<string, Omit<Message, "replyTo" | "forwarded" | "deletedAt">[]> = {
  "c-1": [
    {
      id: "m-1-1",
      conversationId: "c-1",
      senderId: "u-1",
      content: "hey! are we still on for the review tomorrow?",
      attachments: [],
      status: "read",
      editedAt: null,
      createdAt: "2026-07-12T08:30:00.000Z"
    },
    {
      id: "m-1-2",
      conversationId: "c-1",
      senderId: CURRENT_USER_ID,
      content: "yep, 10am works for me",
      attachments: [],
      status: "read",
      editedAt: null,
      createdAt: "2026-07-12T08:35:00.000Z"
    },
    {
      id: "m-1-3",
      conversationId: "c-1",
      senderId: "u-1",
      content: "sounds good, see you then",
      attachments: [],
      status: "delivered",
      editedAt: null,
      createdAt: "2026-07-12T08:41:00.000Z"
    }
  ],
  "c-2": [
    {
      id: "m-2-1",
      conversationId: "c-2",
      senderId: "u-3",
      content: "pushed the new frames to the shared board",
      attachments: [
        {
          id: "a-1",
          type: "image",
          url: "",
          fileName: "frames-v3.png",
          mimeType: "image/png",
          sizeBytes: 842_000,
          width: 1600,
          height: 1000
        }
      ],
      status: "read",
      editedAt: null,
      createdAt: "2026-07-12T07:55:00.000Z"
    }
  ],
  "c-3": [
    {
      id: "m-3-1",
      conversationId: "c-3",
      senderId: "u-4",
      content: "here's the doc you asked for",
      attachments: [
        {
          id: "a-2",
          type: "file",
          url: "",
          fileName: "q3-brief.pdf",
          mimeType: "application/pdf",
          sizeBytes: 231_000
        }
      ],
      status: "read",
      editedAt: null,
      createdAt: "2026-07-11T19:10:00.000Z"
    },
    {
      id: "m-3-2",
      conversationId: "c-3",
      senderId: CURRENT_USER_ID,
      content: "thanks, appreciate it",
      attachments: [],
      status: "read",
      editedAt: null,
      createdAt: "2026-07-11T19:12:00.000Z"
    }
  ],
  "c-4": [
    {
      id: "m-4-1",
      conversationId: "c-4",
      senderId: "u-2",
      content: "can we push the demo to 3pm?",
      attachments: [],
      status: "delivered",
      editedAt: null,
      createdAt: "2026-07-11T14:03:00.000Z"
    }
  ],
  "c-5": [
    {
      id: "m-5-1",
      conversationId: "c-5",
      senderId: "u-5",
      content: "lol yes exactly",
      attachments: [],
      status: "read",
      editedAt: null,
      createdAt: "2026-07-10T21:30:00.000Z"
    }
  ]
};

export const FIXTURE_MESSAGES: Record<string, Message[]> = Object.fromEntries(
  Object.entries(BASE_MESSAGES).map(([conversationId, messages]) => [
    conversationId,
    messages.map((message) => ({ replyTo: null, forwarded: false, deletedAt: null, ...message }))
  ])
);

export { FIXTURE_USERS };
