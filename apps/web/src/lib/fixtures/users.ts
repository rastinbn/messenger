import type { User } from "@messenger/shared-types";

export const CURRENT_USER_ID = "u-0";

export const FIXTURE_USERS: User[] = [
  {
    id: "u-0",
    username: "you",
    displayName: "You",
    avatarUrl: null,
    status: "online",
    statusMessage: null,
    createdAt: "2024-01-10T00:00:00.000Z"
  },
  {
    id: "u-1",
    username: "maren.k",
    displayName: "Maren Koch",
    avatarUrl: null,
    status: "online",
    statusMessage: "heads down, back at 4",
    createdAt: "2024-01-11T00:00:00.000Z"
  },
  {
    id: "u-2",
    username: "theo",
    displayName: "Theo Alvarez",
    avatarUrl: null,
    status: "away",
    statusMessage: null,
    createdAt: "2024-01-12T00:00:00.000Z"
  },
  {
    id: "u-3",
    username: "priya.s",
    displayName: "Priya Shah",
    avatarUrl: null,
    status: "dnd",
    statusMessage: "in a call",
    createdAt: "2024-01-13T00:00:00.000Z"
  },
  {
    id: "u-4",
    username: "jonas",
    displayName: "Jonas Weber",
    avatarUrl: null,
    status: "offline",
    statusMessage: null,
    createdAt: "2024-01-14T00:00:00.000Z"
  },
  {
    id: "u-5",
    username: "lina.wu",
    displayName: "Lina Wu",
    avatarUrl: null,
    status: "online",
    statusMessage: null,
    createdAt: "2024-01-15T00:00:00.000Z"
  },
  {
    id: "u-6",
    username: "sam.rt",
    displayName: "Sam Ortega",
    avatarUrl: null,
    status: "offline",
    statusMessage: null,
    createdAt: "2024-01-16T00:00:00.000Z"
  }
];

export function findUser(id: string): User | undefined {
  return FIXTURE_USERS.find((u) => u.id === id);
}

export function toPublicUser(u: User) {
  const { id, username, displayName, avatarUrl, status, statusMessage } = u;
  return { id, username, displayName, avatarUrl, status, statusMessage };
}
