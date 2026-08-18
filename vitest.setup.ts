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

// jsdom implements neither pointer capture nor the observers Radix's Select
// uses to place its listbox, and it stubs no scrolling. Phase 5's counterparty
// dropdowns are the first Radix component this suite drives by pointer, so
// without these every click on a trigger throws before the list opens. None of
// them change behavior under test — they let the component reach the state a
// real browser would put it in.
if (typeof window !== "undefined") {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};

  window.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

afterEach(() => {
  cleanup();
});
