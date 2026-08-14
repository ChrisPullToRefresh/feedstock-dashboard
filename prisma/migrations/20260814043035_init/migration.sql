-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateTable
CREATE TABLE "producers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "producers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sequestration_sites" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sequestration_sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movements" (
    "id" TEXT NOT NULL,
    "direction" "Direction" NOT NULL,
    "weight_kg" DECIMAL(12,3) NOT NULL,
    "producer_id" TEXT,
    "sequestration_site_id" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "producers_name_key" ON "producers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sequestration_sites_name_key" ON "sequestration_sites"("name");

-- AddForeignKey
ALTER TABLE "movements" ADD CONSTRAINT "movements_producer_id_fkey" FOREIGN KEY ("producer_id") REFERENCES "producers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movements" ADD CONSTRAINT "movements_sequestration_site_id_fkey" FOREIGN KEY ("sequestration_site_id") REFERENCES "sequestration_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Hand-written below this line. Prisma cannot express either rule, so both
-- are written here and guarded by tests that read this file — a regenerated
-- migration that dropped them would fail those tests rather than silently
-- ship a database that no longer enforces the constraint.

-- A movement carries exactly the counterparty its direction implies: inbound
-- from a producer, outbound to a sequestration site. Anything else — both set,
-- neither set, or the wrong one for the direction — is rejected by the
-- database rather than by application code.
ALTER TABLE "movements" ADD CONSTRAINT "movements_counterparty_matches_direction" CHECK (
    (
        "direction" = 'INBOUND'
        AND "producer_id" IS NOT NULL
        AND "sequestration_site_id" IS NULL
    )
    OR (
        "direction" = 'OUTBOUND'
        AND "sequestration_site_id" IS NOT NULL
        AND "producer_id" IS NULL
    )
);

-- Movements are append-only. specs/mission.md § Constraints: "a mistake is
-- corrected by recording a new adjusting entry, never by editing or deleting
-- history". Enforced here rather than remembered, so no application code path
-- and no hand-run statement in psql can rewrite the record.
--
-- Nothing guards this trigger between pull requests — plan.md § Decisions
-- accepts that deliberately, and validation.md § Manual steps 8-9 prove it
-- once by hand.
CREATE OR REPLACE FUNCTION "reject_movement_mutation"() RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION
        'movements are append-only: % is not permitted. Record an adjusting entry instead.',
        TG_OP
        USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "movements_are_append_only"
    BEFORE UPDATE OR DELETE ON "movements"
    FOR EACH ROW
    EXECUTE FUNCTION "reject_movement_mutation"();
