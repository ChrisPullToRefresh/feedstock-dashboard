import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// `src/lib/db.ts` refuses to build a client without a connection string, and
// modules that export queries alongside pure helpers pull it in on import. No
// test opens a connection; this only lets those modules load.
process.env.DATABASE_URL ??=
  "postgresql://user:pw@localhost:5432/placeholder-never-connected";

afterEach(() => {
  cleanup();
});
