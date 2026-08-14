-- Producer names are unique regardless of case. The @unique on `name` that the
-- initial migration created is case-sensitive, so "Cascade Timber Mill" and
-- "cascade timber mill" could both exist — two rows for one real producer.
-- specs/roadmap.md Phase 6 groups totals by producer and Phase 5 puts them in a
-- dropdown, so that would split the numbers and mislead the operator.
--
-- Hand-written because Prisma cannot express an index over an expression. The
-- test in src/test/prisma-migration.test.ts is what stops a regenerated
-- migration from dropping it silently, the same guard the counterparty check
-- constraint uses.
--
-- The column keeps its own case-sensitive unique index as well. That one is
-- redundant while this exists, but dropping it would change what the seed's
-- upsert-on-name resolves against.

-- CreateIndex
CREATE UNIQUE INDEX "producers_name_lower_key" ON "producers" (lower("name"));
