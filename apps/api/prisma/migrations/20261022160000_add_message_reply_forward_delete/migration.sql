-- Reply / forward / soft-delete support for messages.
--
-- Written defensively (IF NOT EXISTS + a guarded constraint) because some
-- development databases already carry an earlier, unversioned copy of the
-- reply/delete columns from a sibling branch. On a clean database this creates
-- everything; on the drifted one it only fills in what is missing.

ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "forwarded" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "replyToId" TEXT;

CREATE INDEX IF NOT EXISTS "messages_replyToId_idx" ON "messages"("replyToId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_replyToId_fkey') THEN
    ALTER TABLE "messages"
      ADD CONSTRAINT "messages_replyToId_fkey"
      FOREIGN KEY ("replyToId") REFERENCES "messages"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
