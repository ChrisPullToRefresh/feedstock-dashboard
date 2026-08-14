import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "../src/generated/prisma/client.ts";

/**
 * Loads the reference data every movement is recorded against.
 *
 *   npm run seed
 *
 * Idempotent by design — plan.md § Decisions. Each row is upserted on its
 * name, so running this twice leaves exactly the same rows, which is what
 * makes it safe against a shared database and what lets the Database CI job
 * prove it by running the seed twice and comparing counts.
 *
 * The update half of each upsert is deliberately empty: re-seeding must not
 * revive a producer someone archived, or overwrite a name they corrected.
 * This script creates what is missing and touches nothing else.
 *
 * It seeds no movements. Those are records of things that physically
 * happened, and inventing them would put weights into totals that no one
 * ever put on a scale.
 */

const PRODUCERS = [
  "Cascade Timber Mill",
  "Willamette Orchard Cooperative",
  "Blue Mountain Forestry",
  "Riverbend Sawmill",
  "Prairie Grain Collective",
  "High Desert Ranch",
] as const;

const SEQUESTRATION_SITES = [
  "Basalt Ridge Injection Site",
  "Coulee Farmland Application",
  "Harney Basin Storage",
  "Deschutes Rangeland Spread",
] as const;

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set — run `vercel env pull .env.local` first",
    );
  }

  const db = new PrismaClient({
    adapter: new PrismaNeon({ connectionString }),
  });

  try {
    for (const name of PRODUCERS) {
      await db.producer.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    }

    for (const name of SEQUESTRATION_SITES) {
      await db.sequestrationSite.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    }

    const [producers, sequestrationSites] = await Promise.all([
      db.producer.count(),
      db.sequestrationSite.count(),
    ]);

    console.log(`producers            ${producers}`);
    console.log(`sequestration sites  ${sequestrationSites}`);
  } finally {
    await db.$disconnect();
  }
}

await main();
