/**
 * Verifies that a database is actually deployable — i.e. that the migrations in
 * prisma/migrations have been applied *and* that the resulting schema has the
 * tables/columns the running code expects.
 *
 * This exists because `prisma migrate status` only reads `_prisma_migrations`:
 * a database can claim to be up to date while a table is missing (half-applied
 * deploy, restored dump, wrong database). And a green local run says nothing
 * about the production database — point DATABASE_URL at the real one.
 *
 * Usage:
 *   DATABASE_URL="postgresql://…?sslmode=require" pnpm --filter @messenger/api db:check
 *
 * Exit code 0 = deployable, 1 = missing migrations or schema.
 */
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "prisma", "migrations");

const REQUIRED_TABLES = [
  "users",
  "conversations",
  "conversation_participants",
  "messages",
  "attachments",
  "notifications",
  "refresh_tokens",
  "contact_links",
  "email_verification_tokens",
  "magic_link_tokens"
];

const REQUIRED_COLUMNS = [
  ["messages", "replyToId"],
  ["messages", "forwarded"],
  ["messages", "deletedAt"],
  ["users", "emailVerifiedAt"],
  ["users", "siteRole"]
];

const prisma = new PrismaClient();
let failures = 0;

function fail(message) {
  failures += 1;
  console.log(`  ✗ ${message}`);
}

function pass(message) {
  console.log(`  ✓ ${message}`);
}

function onDiskMigrations() {
  return readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function main() {
  const target = (process.env.DATABASE_URL ?? "").replace(/:\/\/([^:]+):[^@]+@/, "://$1:****@");
  console.log(`Database: ${target || "(DATABASE_URL is not set)"}\n`);

  // 1. Migration bookkeeping -------------------------------------------------
  console.log("Migrations");
  let applied = [];
  try {
    const rows = await prisma.$queryRaw`
      SELECT migration_name, finished_at
      FROM _prisma_migrations
      ORDER BY started_at
    `;
    applied = rows.filter((row) => row.finished_at !== null).map((row) => row.migration_name);
  } catch {
    fail("_prisma_migrations does not exist — this database has never been migrated");
  }

  const expected = onDiskMigrations();
  const pending = expected.filter((name) => !applied.includes(name));

  if (applied.length) pass(`${applied.length} migration(s) applied`);
  if (pending.length) {
    fail(`${pending.length} migration(s) not applied: ${pending.join(", ")}`);
    console.log("    → run: pnpm --filter @messenger/api prisma:migrate:deploy");
  } else if (expected.length) {
    pass("no pending migrations");
  }

  // Applied here but absent from this checkout: schema drift (a sibling branch's
  // migration, a restored dump, …). Not fatal, but worth knowing about.
  const unknown = applied.filter((name) => !expected.includes(name));
  if (unknown.length) {
    console.log(`  ! applied but not in this checkout: ${unknown.join(", ")}`);
  }

  // 2. Actual schema ---------------------------------------------------------
  console.log("\nSchema");
  const tables = new Set(
    (
      await prisma.$queryRaw`
        SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
      `
    ).map((row) => row.table_name)
  );

  const missingTables = REQUIRED_TABLES.filter((table) => !tables.has(table));
  if (missingTables.length === 0) pass(`${REQUIRED_TABLES.length} required tables present`);
  else fail(`missing tables: ${missingTables.join(", ")}`);

  const columns = new Set(
    (
      await prisma.$queryRaw`
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
      `
    ).map((row) => `${row.table_name}.${row.column_name}`)
  );

  const missingColumns = REQUIRED_COLUMNS.filter(([table, column]) => !columns.has(`${table}.${column}`));
  if (missingColumns.length === 0) pass("columns added by later migrations are present");
  else fail(`missing columns: ${missingColumns.map(([t, c]) => `${t}.${c}`).join(", ")}`);

  console.log(
    failures === 0
      ? "\nResult: database is ready for this build."
      : `\nResult: ${failures} problem(s) — do not deploy against this database yet.`
  );
}

main()
  .catch((error) => {
    console.error(`\nCould not inspect the database: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    if (failures > 0) process.exitCode = 1;
  });
