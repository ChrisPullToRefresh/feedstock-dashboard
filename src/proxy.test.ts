import { describe, expect, it } from "vitest";

import { config } from "@/proxy";

/*
 * Nothing asserted `config.matcher` before this. It decides which requests
 * Clerk ever sees, so a path it skips is a path served with no session — the
 * gate is silent rather than open, which is the hardest kind of hole to spot.
 *
 * `specs/roadmap.md` Phase 3 measured the one this replaces: with a
 * `/producers/[id]` route in place, `/producers/acme.co` returned 200 with page
 * content while `/producers/acme` returned 307.
 */

/**
 * Whether Next would run the proxy for `pathname`.
 *
 * Next compiles each matcher entry to a regular expression anchored at both
 * ends, which is what the entries are already written as.
 */
function runsOn(pathname: string): boolean {
  return config.matcher.some((pattern) =>
    new RegExp(`^${pattern}$`).test(pathname),
  );
}

describe("which requests the proxy runs on", () => {
  it.each([
    // The hole this closes: a dot in the last segment used to read as a file
    // extension, so the id looked like a static asset.
    "/producers/acme.co",
    "/producers/acme.io",
    "/producers/co.uk-holdings",
  ])("protects %s, an id containing a dot", (pathname) => {
    expect(runsOn(pathname)).toBe(true);
  });

  it.each([
    // An extension part-way along the path is not a static file. Without the
    // trailing anchor these were skipped, which is the same hole this matcher
    // exists to close — and the tests above miss it, because they all end in
    // the extension.
    "/producers/x.svg/edit",
    "/producers/report.csv-co",
    "/producers/clx1.png/edit",
  ])(
    "protects %s, where the extension is not the end of the path",
    (pathname) => {
      expect(runsOn(pathname)).toBe(true);
    },
  );

  it("still treats a final segment that is a listed extension as a file", () => {
    // The limit of this approach, stated rather than hidden: /producers/a.zip
    // reads as a static file and is skipped. Producer ids are cuids, which
    // contain no dots, so nothing reachable in the app lands here — and the
    // roadmap's case, /producers/acme.co, is protected because `co` is not a
    // listed extension.
    expect(runsOn("/producers/acme.zip")).toBe(false);
    expect(runsOn("/producers/acme.co")).toBe(true);
  });

  it.each([
    "/",
    "/producers",
    "/producers/acme",
    "/producers/new",
    "/producers/clx123/edit",
    "/record",
    "/sites",
  ])("protects %s", (pathname) => {
    expect(runsOn(pathname)).toBe(true);
  });

  it.each([
    "/favicon.ico",
    "/_next/static/chunks/main.js",
    "/_next/static/css/app.css",
    "/logo.svg",
    "/photo.jpeg",
    "/fonts/inter.woff2",
  ])("skips %s, which is a static asset", (pathname) => {
    // Over-correcting is the other failure: sending Next's build output through
    // Clerk breaks styling and fonts on every page.
    expect(runsOn(pathname)).toBe(false);
  });

  it("runs on API routes", () => {
    expect(runsOn("/api/anything")).toBe(true);
  });
});
