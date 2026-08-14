import { createRouteMatcher } from "@clerk/nextjs/server";
import { describe, expect, it } from "vitest";

import { PUBLIC_ROUTES } from "@/lib/routes";

/*
 * These run against Clerk's own matcher, the code `src/proxy.ts` actually
 * calls. An earlier version of this file also tested a local helper that
 * mirrored the rule; nothing in production called it, and two functions named
 * `isPublicRoute` with different semantics is a trap rather than coverage.
 */
describe("the public route list, as Clerk evaluates it", () => {
  const isPublic = createRouteMatcher([...PUBLIC_ROUTES]);
  // Clerk reads `nextUrl.pathname`, so a plain Request will not do.
  const request = (pathname: string) =>
    ({ nextUrl: new URL(`https://feedstock.test${pathname}`) }) as never;

  it.each(["/sign-in", "/sign-in/factor-one", "/sign-in/sso-callback"])(
    "leaves %s reachable signed out",
    (pathname) => {
      expect(isPublic(request(pathname))).toBe(true);
    },
  );

  it.each(["/", "/record", "/producers", "/sites"])(
    "protects %s",
    (pathname) => {
      expect(isPublic(request(pathname))).toBe(false);
    },
  );

  it("protects a page that does not exist yet", () => {
    // The rule is inverted deliberately: Phases 3 to 6 add pages, and none of
    // them should need a middleware change to be protected.
    expect(isPublic(request("/movements/new"))).toBe(false);
  });

  it("does not treat a path merely starting with sign-in as public", () => {
    expect(isPublic(request("/sign-invoice"))).toBe(false);
  });
});
