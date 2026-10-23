# New Features: Admin Panel, GIF Support, Group Chat Hardening

## 1. Merge the Prisma schema changes

See `apps/api/prisma/schema-additions-2.prisma` in this patch. Summary:
- New enum `SiteRole { user admin }`
- Two new fields on `User`: `siteRole SiteRole @default(user)` and `suspendedAt DateTime?`

Then:
```bash
cd apps/api
pnpm prisma:generate
pnpm prisma:migrate:dev --name add_admin_role
```

## 2. Make yourself an admin

The easiest way: re-run the seed (it now marks `you@example.com` as admin), or manually promote your
existing account via SQL:

```bash
docker compose exec postgres psql -U messenger -d messenger -c "UPDATE users SET \"siteRole\" = 'admin' WHERE email = 'your-email@example.com';"
```

(Swap in your actual email. `psql` is case-sensitive about the quoted column name — keep the
`\"siteRole\"` exactly as shown.)

## 3. Copy over the files

**New backend module** — copy the whole directory:
- `apps/api/src/modules/admin/`

**New backend files:**
- `apps/api/src/common/guards/admin.guard.ts`

**Replace these backend files entirely:**
- `apps/api/src/app.module.ts`
- `apps/api/src/common/decorators/current-user.decorator.ts`
- `apps/api/src/modules/auth/infrastructure/jwt.strategy.ts`
- `apps/api/src/modules/users/domain/user.entity.ts`
- `apps/api/src/modules/users/application/ports/user-repository.port.ts`
- `apps/api/src/modules/users/application/users.service.ts`
- `apps/api/src/modules/users/infrastructure/prisma-user.repository.ts`
- `apps/api/src/modules/users/interface/dto/public-user.dto.ts`
- `apps/api/prisma/seed.ts`

**New frontend files:**
- `apps/web/src/lib/api/admin.ts`
- `apps/web/src/hooks/useAdmin.ts`
- `apps/web/src/components/layout/AdminGuard/`
- `apps/web/src/components/chat/NewGroupModal/`
- `apps/web/src/app/(app)/admin/` *(whole directory: layout, overview, users, conversations pages)*

**Replace these frontend files entirely:**
- `packages/shared-types/src/user.ts`
- `apps/web/src/components/layout/NavRail/NavRail.tsx`
- `apps/web/src/components/layout/MobileTabBar/MobileTabBar.tsx`
- `apps/web/src/components/layout/ConversationListPanel/ConversationListPanel.tsx`
- `apps/web/src/components/ui/ImageCard/ImageCard.tsx`
- `apps/web/src/components/chat/ChatBubble/ChatBubble.tsx`
- `apps/web/src/components/chat/MessageComposer/MessageComposer.tsx`

## 4. Restart everything

```bash
cd apps/api && pnpm dev
cd apps/web && pnpm dev
```

## What's new

**Admin panel** (`/admin`, only visible/accessible to accounts with `siteRole: "admin"`):
- **Overview** — total users, new signups today/this week, total conversations/messages, messages
  today, suspended-user count.
- **Users** — search, suspend/unsuspend (suspension blocks login and API access on the user's
  *very next request*, not just at their next token refresh — see `JwtStrategy.validate`),
  promote/revoke admin, permanently delete. You can't suspend, demote, or delete your own account
  from the panel (guarded server-side, not just hidden in the UI).
- **Conversations** — site-wide list with participant/message counts, delete any conversation
  (moderation).

A non-admin who navigates to `/admin` directly gets redirected to `/chat` — enforced both
client-side (`AdminGuard`) and server-side (`AdminGuard` on every `/v1/admin/*` route, independent
of the frontend).

**GIF support** — the media upload pipeline already allowed `image/gif` (GIFs are just images), so
this was mostly wiring: a dedicated "GIF" button next to the attach button in the composer (opens a
file picker filtered to `.gif`), and a small "GIF" badge on the resulting attachment so they're
visually distinguishable from regular photos. Animated playback works because the image renders via
`unoptimized` (bypasses Next's image pipeline, which would otherwise flatten animation to a static
frame).

**Group chat hardening** — audited the existing group chat/call code and found the actual gap:
group conversations and group calls both worked correctly end-to-end, but there was **no UI to
create a group** — Contacts and Search only ever offered 1:1 "Message." Added a "+" button in the
chat list header opening a `NewGroupModal` (pick 2+ contacts, optional name, create). No changes
were needed to the call or messaging logic itself — it already handled N participants correctly.

## Known limitations, stated plainly

- Admin actions (suspend, delete, role change) aren't logged to an audit trail — there's no record
  of *which* admin did *what* and *when*, beyond your database's own row timestamps. Worth adding
  before this goes near real users.
- Deleting a user or conversation is immediate and permanent (relies on Prisma's cascading
  deletes) — no soft-delete/undo window.
- The admin "delete message" endpoint exists but there's no admin UI wired to it yet (only
  conversation-level delete has a button) — the API is there if you want to add a per-message
  moderation view later.
