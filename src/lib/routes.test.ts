import { createRouteMatcher } from "@clerk/nextjs/server";
import { describe, expect, it } from "vitest";

import { PUBLIC_ROUTES, isInternalAsset, isPublicRoute } from "@/lib/routes";

describe("isPublicRoute", () => {
  it.each(["/", "/record", "/producers", "/sites"])(
    "protects %s",
    (pathname) => {
      expect(isPublicRoute(pathname)).toBe(false);
    },
  );

  it("protects a page that does not exist yet", () => {
    // The rule is inverted deliberately: Phases 3 to 6 add pages, and none of
    // them should need a middleware change to be protected.
    expect(isPublicRoute("/movements/new")).toBe(false);
  });

  it.each(["/sign-in", "/sign-in/factor-one", "/sign-in/sso-callback"])(
    "leaves %s reachable signed out",
    (pathname) => {
      expect(isPublicRoute(pathname)).toBe(true);
    },
  );

  it.each(["/_next/static/chunk.js", "/favicon.ico", "/robots.txt"])(
    "does not gate %s",
    (pathname) => {
      expect(isPublicRoute(pathname)).toBe(true);
    },
  );

  it("does not treat a path merely starting with sign-in as public", () => {
    expect(isPublicRoute("/sign-invoice")).toBe(false);
  });
});

describe("isInternalAsset", () => {
  it("matches Next's output and files, not pages", () => {
    expect(isInternalAsset("/_next/static/chunk.js")).toBe(true);
    expect(isInternalAsset("/favicon.ico")).toBe(true);
    expect(isInternalAsset("/producers")).toBe(false);
  });
});

/*
 * The gate that actually runs. The helper above mirrors the rule for the tests
 * that need a plain string, but `src/middleware.ts` hands PUBLIC_ROUTES to
 * Clerk, and Clerk's matcher is a different implementation — so the patterns
 * are asserted against it directly rather than against the mirror.
 */
describe("Clerk's matcher, given the same routes", () => {
  const isPublic = createRouteMatcher([...PUBLIC_ROUTES]);
  // Clerk reads `nextUrl.pathname`, so a plain Request will not do.
  const request = (pathname: string) =>
    ({ nextUrl: new URL(`https://feedstock.test${pathname}`) }) as never;

  it.each(["/sign-in", "/sign-in/factor-one"])(
    "leaves %s reachable signed out",
    (pathname) => {
      expect(isPublic(request(pathname))).toBe(true);
    },
  );

  it.each(["/", "/producers", "/sign-invoice"])("protects %s", (pathname) => {
    expect(isPublic(request(pathname))).toBe(false);
  });
});
