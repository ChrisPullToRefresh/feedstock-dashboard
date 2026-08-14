import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// `src/lib/db.ts` refuses to build a client without a connection string, and
// modules that export queries alongside pure helpers pull it in on import. No
// test opens a connection; this only lets those modules load.
process.env.DATABASE_URL ??=
  "postgresql://user:pw@localhost:5432/placeholder-never-connected";

// jsdom implements no media queries. Sonner reads one on mount to follow the
// operating system's colour scheme, so without this every test that renders
// the app shell throws. `matches: false` is the light palette, which is what
// a headless run should assume.
if (typeof window !== "undefined" && window.matchMedia === undefined) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

afterEach(() => {
  cleanup();
});
