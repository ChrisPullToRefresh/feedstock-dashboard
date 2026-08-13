/**
 * Which routes the middleware protects.
 *
 * `specs/mission.md` says internal staff only, and `specs/tech-stack.md` § Auth
 * gates the app rather than individual pages, so the rule is inverted from the
 * usual one: everything is protected, and the exceptions are listed. A new page
 * is therefore protected by default — forgetting to add it to a list cannot
 * expose it.
 */
/*
 * Split rather than written `/sign-in(.*)`, which is the shape Clerk's own
 * examples use: that pattern also matches `/sign-invoice`, because the wildcard
 * is not anchored to a path boundary. Naming the segment boundary keeps a route
 * that merely starts with the same letters protected.
 */
export const PUBLIC_ROUTES = ["/sign-in", "/sign-in/(.*)"] as const;

/** Paths the middleware never runs on: Next's build output and static files. */
export function isInternalAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/") ||
    // A dot in the last segment means a file — favicon.ico, robots.txt.
    /\.[^/]+$/.test(pathname)
  );
}

/** Whether a path is reachable without a session. */
export function isPublicRoute(pathname: string): boolean {
  if (isInternalAsset(pathname)) return true;

  return PUBLIC_ROUTES.some((route) => new RegExp(`^${route}$`).test(pathname));
}
