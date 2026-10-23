# Roadmap

## Phase 0 — Planning ✅
Architecture, folder structure, conventions.

## Phase 1 — Frontend (in progress)
Full UI (Next.js/React/TS/Tailwind) against mocked services. Landing, auth, chat list/window, profile, settings, notifications, search, contacts, file/image viewers, error pages.

## Phase 2 — Backend
NestJS + PostgreSQL/Prisma + Redis + Socket.IO. Auth, users, conversations, messaging, presence, notifications, media upload. Wired to replace Phase 1 mocks behind the existing service interfaces.

## Post-v1 (Future Consideration)
- Voice / video calls
- Discord-style guild/server spaces with channels & roles
- End-to-end encryption
- Bots / webhooks / third-party integrations
- Federation / multi-server support
- Push notifications (mobile/web push) and email digests
- Message search (full-text) at scale
- Admin/moderation tooling

Items in this section are explicitly out of scope until v1 is stable and approved for expansion.
