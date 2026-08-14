/**
 * Which routes are reachable without a session.
 *
 * `specs/mission.md` says internal staff only, and `specs/tech-stack.md` § Auth
 * gates the app rather than individual pages, so the rule is inverted from the
 * usual one: everything is protected, and the exceptions are listed. A new page
 * is therefore protected by default — forgetting to add it to a list cannot
 * expose it.
 *
 * `src/middleware.ts` hands this list to Clerk's `createRouteMatcher`, which is
 * the only thing that evaluates it. There is deliberately no local
 * reimplementation to test against: a mirror can agree with its own tests while
 * the real gate behaves differently.
 *
 * Split rather than written `/sign-in(.*)`, which is the shape Clerk's own
 * examples use: that pattern also matches `/sign-invoice`, because the wildcard
 * is not anchored to a path boundary. Naming the segment boundary keeps a route
 * that merely starts with the same letters protected.
 */
export const PUBLIC_ROUTES = ["/sign-in", "/sign-in/(.*)"] as const;
