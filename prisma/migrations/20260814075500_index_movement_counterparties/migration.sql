-- Prisma does not index relation scalar fields on PostgreSQL by itself, so the
-- initial migration created indexes on the two reference names and nothing on
-- the movement foreign keys. Without these, the onDelete: Restrict check reads
-- the whole movements table on every producer or sequestration site delete, and
-- Phase 6's totals by counterparty have no index to group on.
--
-- A separate migration rather than an edit to the initial one: that migration
-- is already applied, and changing it would break its recorded checksum on
-- every database that has it.

-- CreateIndex
CREATE INDEX "movements_producer_id_idx" ON "movements"("producer_id");

-- CreateIndex
CREATE INDEX "movements_sequestration_site_id_idx" ON "movements"("sequestration_site_id");
