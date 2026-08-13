import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

import { PUBLIC_ROUTES } from "@/lib/routes";

const isPublicRoute = createRouteMatcher([...PUBLIC_ROUTES]);

/**
 * Everything is protected except the routes named in `PUBLIC_ROUTES`. Gating by
 * exception rather than by enumeration means a page added in a later phase is
 * protected the moment it exists — `specs/mission.md` allows internal staff
 * only, so an omission must fail closed.
 */
export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next's build output and anything with a file extension, then run on
    // everything else, API routes included.
    "/((?!_next|[^?]*\\.[^?/]+$).*)",
    "/(api|trpc)(.*)",
  ],
};
