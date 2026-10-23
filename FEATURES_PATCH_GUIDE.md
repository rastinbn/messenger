# New Features: Image Upload, Video Calls, Email Authentication

This patch adds three features on top of the existing Phase 2 backend + frontend integration.
Follow these steps in order.

## 1. Merge the Prisma schema changes

Open `apps/api/prisma/schema-additions.prisma` in this patch — it has exact instructions for what
to add to your existing `apps/api/prisma/schema.prisma`:
- One new field on `User`: `emailVerifiedAt DateTime?` (+ two new relation fields)
- Two new models: `EmailVerificationToken`, `MagicLinkToken`

Then generate a migration:

```bash
cd apps/api
pnpm prisma:generate
pnpm prisma:migrate:dev --name add_email_auth
```

## 2. Add backend dependencies

`apps/api/package.json.additions` lists what to merge in. Or just run:

```bash
cd apps/api
pnpm add nodemailer
pnpm add -D @types/nodemailer
```

## 3. Add backend env vars

Merge `apps/api/.env.additions` into your `apps/api/.env` (and `.env.example`). At minimum you
don't need to change anything — `EMAIL_PROVIDER` defaults to `"console"`, which logs verification
and magic-link emails to your API server's terminal instead of actually sending them. That's fully
functional for testing: register a user, watch the terminal for the verification link, paste it
into a browser.

To send real emails later, set `EMAIL_PROVIDER=smtp` and fill in `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/`SMTP_FROM`
with any SMTP provider's credentials (SendGrid, Postmark, Mailgun, Gmail app password, etc.).

## 4. Copy over the new/changed backend files

New modules (copy these directories in as-is):
- `apps/api/src/modules/contacts/` *(if you don't already have this from the last patch)*
- `apps/api/src/modules/email/`
- `apps/api/src/modules/calls/`

New files inside existing modules:
- `apps/api/src/modules/auth/application/ports/email-verification-repository.port.ts`
- `apps/api/src/modules/auth/application/ports/magic-link-repository.port.ts`
- `apps/api/src/modules/auth/infrastructure/prisma-email-verification.repository.ts`
- `apps/api/src/modules/auth/infrastructure/prisma-magic-link.repository.ts`
- `apps/api/src/modules/auth/interface/dto/verify-email.dto.ts`
- `apps/api/src/modules/auth/interface/dto/magic-link.dto.ts`
- `apps/api/src/modules/auth/interface/dto/consume-magic-link.dto.ts`
- `apps/api/src/modules/messaging/domain/errors.ts`

Replace these existing files entirely with the versions in this patch:
- `apps/api/src/app.module.ts`
- `apps/api/src/config/env.validation.ts`
- `apps/api/src/modules/auth/domain/errors.ts`
- `apps/api/src/modules/auth/application/auth.service.ts`
- `apps/api/src/modules/auth/auth.module.ts`
- `apps/api/src/modules/auth/interface/auth.controller.ts`
- `apps/api/src/modules/users/domain/user.entity.ts`
- `apps/api/src/modules/users/application/ports/user-repository.port.ts`
- `apps/api/src/modules/users/application/users.service.ts`
- `apps/api/src/modules/users/infrastructure/prisma-user.repository.ts`
- `apps/api/src/modules/users/interface/dto/public-user.dto.ts`
- `apps/api/src/modules/messaging/application/messaging.service.ts`
- `apps/api/src/modules/messaging/interface/dto/send-message.dto.ts`
- `apps/api/src/modules/messaging/interface/messages.controller.ts`

## 5. Copy over the new/changed frontend files

New files:
- `apps/web/src/lib/api/upload.ts`
- `apps/web/src/lib/api/ice-servers.ts`
- `apps/web/src/hooks/useCall.ts`
- `apps/web/src/stores/useCallStore.ts`
- `apps/web/src/components/call/` *(whole directory: VideoTile, CallOverlay, IncomingCallBanner, CallProvider)*
- `apps/web/src/app/verify-email/page.tsx`
- `apps/web/src/app/magic-login/page.tsx`

Replace these existing files entirely:
- `packages/shared-types/src/user.ts`
- `apps/web/src/lib/services/types.ts`
- `apps/web/src/lib/services/mock/mockAuthService.ts`
- `apps/web/src/lib/services/http/httpAuthService.ts`
- `apps/web/src/hooks/useAuth.ts`
- `apps/web/src/components/ui/ImageCard/ImageCard.tsx`
- `apps/web/src/components/chat/ChatBubble/ChatBubble.tsx`
- `apps/web/src/components/chat/ImageViewerModal/ImageViewerModal.tsx`
- `apps/web/src/components/chat/MessageComposer/MessageComposer.tsx`
- `apps/web/src/components/chat/ChatWindowHeader/ChatWindowHeader.tsx`
- `apps/web/src/app/(app)/layout.tsx`
- `apps/web/src/app/(app)/chat/[conversationId]/page.tsx`
- `apps/web/src/app/login/page.tsx`
- `apps/web/src/app/(app)/settings/page.tsx`

## 6. Restart everything

```bash
# terminal 1
cd apps/api && pnpm dev

# terminal 2
cd apps/web && pnpm dev
```

## Trying each feature

**Image upload:** open any conversation, click the 📎 button, pick an image. It uploads
immediately (you'll see a small spinner chip above the composer), then send — the image renders
inline in the chat, click it to open the full viewer.

**Video calls:** click the 🎥 icon in a conversation header. Your browser will ask for
camera/mic permission. Other participants get an `call:incoming` banner they can answer. Works for
groups (mesh topology — realistic for up to ~4-6 people at once, see `docs/video-calls.md` for why).
To test locally with two "people," open two browser profiles/incognito windows logged in as
different users.

**Email verification:** register a new account. With `EMAIL_PROVIDER=console` (the default),
check your **API server's terminal** — the verification email (with a clickable-looking link) is
printed there. Copy the URL into your browser (it'll be `http://localhost:3000/verify-email?token=...`).
Settings shows a "Verify your email" banner with a resend button until you do.

**Magic link login:** on the login page, click "Email me a login link instead," enter your email.
Again with the console provider, check the API terminal for the link
(`http://localhost:3000/magic-login?token=...`).

## Known limitations, stated plainly

- Video calls: mesh topology only, no TURN server configured (STUN-only — see `docs/video-calls.md`
  for exactly what that means and how to add TURN later), no call history, no screen share yet.
- Email: console provider by default — you must switch to `EMAIL_PROVIDER=smtp` with real
  credentials before this reaches actual users' inboxes.
- Image upload: uses the same local-disk media storage flagged as a pre-production placeholder in
  `docs/deployment.md` — same S3 migration note applies.
