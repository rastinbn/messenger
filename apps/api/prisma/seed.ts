/**
 * Seeds the database with data that mirrors the frontend's mock fixtures
 * (apps/web/src/lib/fixtures/), so switching the frontend from mock services
 * to the real API produces a familiar, consistent demo state.
 *
 * Run with: pnpm --filter @messenger/api prisma:seed
 */
import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function upsertUser(u: {
  email: string;
  username: string;
  displayName: string;
  status: "online" | "away" | "offline" | "dnd";
  passwordHash: string;
  siteRole?: "user" | "admin";
}) {
  return prisma.user.upsert({
    where: { email: u.email },
    update: {},
    create: u
  });
}

async function main() {
  const passwordHash = await argon2.hash("password123", { type: argon2.argon2id });

  // Explicit tuple of calls (not `.map()` over an array) so TypeScript knows
  // exactly 7 elements come back, in this order — `.map()` + Promise.all
  // widens to a generic array type, which under `noUncheckedIndexedAccess`
  // makes every destructured element `T | undefined`.
  const [you, maren, theo, priya, jonas, lina, sam] = await Promise.all([
    upsertUser({ email: "you@example.com", username: "you", displayName: "You", status: "online", passwordHash, siteRole: "admin" }),
    upsertUser({ email: "maren@example.com", username: "maren.k", displayName: "Maren Koch", status: "online", passwordHash }),
    upsertUser({ email: "theo@example.com", username: "theo", displayName: "Theo Alvarez", status: "away", passwordHash }),
    upsertUser({ email: "priya@example.com", username: "priya.s", displayName: "Priya Shah", status: "dnd", passwordHash }),
    upsertUser({ email: "jonas@example.com", username: "jonas", displayName: "Jonas Weber", status: "offline", passwordHash }),
    upsertUser({ email: "lina@example.com", username: "lina.wu", displayName: "Lina Wu", status: "online", passwordHash }),
    upsertUser({ email: "sam@example.com", username: "sam.rt", displayName: "Sam Ortega", status: "offline", passwordHash })
  ]);

  const dm = await prisma.conversation.create({
    data: {
      type: "direct",
      participants: {
        create: [
          { userId: you.id, role: "owner" },
          { userId: maren.id, role: "member" }
        ]
      },
      messages: {
        create: [
          { senderId: maren.id, content: "hey! are we still on for the review tomorrow?" },
          { senderId: you.id, content: "yep, 10am works for me" },
          { senderId: maren.id, content: "sounds good, see you then" }
        ]
      }
    }
  });

  await prisma.conversation.create({
    data: {
      type: "group",
      name: "Design Weekly",
      participants: {
        create: [
          { userId: you.id, role: "owner" },
          { userId: theo.id, role: "member" },
          { userId: priya.id, role: "member" },
          { userId: lina.id, role: "member" }
        ]
      },
      messages: {
        create: [{ senderId: priya.id, content: "pushed the new frames to the shared board" }]
      }
    }
  });

  await prisma.conversation.create({
    data: {
      type: "group",
      name: "Launch Squad",
      participants: {
        create: [
          { userId: you.id, role: "owner" },
          { userId: maren.id, role: "member" },
          { userId: theo.id, role: "member" },
          { userId: priya.id, role: "member" },
          { userId: sam.id, role: "member" }
        ]
      },
      messages: {
        create: [{ senderId: theo.id, content: "can we push the demo to 3pm?" }]
      }
    }
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: you.id,
        type: "message",
        title: "Maren Koch",
        body: "sounds good, see you then",
        relatedConversationId: dm.id
      },
      {
        userId: you.id,
        type: "friend_request",
        title: "Sam Ortega",
        body: "wants to add you as a contact",
        read: true
      }
    ]
  });

  // jonas is seeded but not currently placed in a conversation — silence the unused-var lint.
  void jonas;

  console.log("Seed complete. Demo login: you@example.com / password123 (this account is a site admin — visit /admin once logged in)");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
