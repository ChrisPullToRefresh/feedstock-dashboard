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
  if (isPublicRoute(request)) return;

  const { userId, redirectToSignIn } = await auth();

  // Not `auth.protect()`. That answers an unauthenticated page request with a
  // 404 when it cannot resolve a sign-in URL of its own, which reads as "no
  // such page" rather than "sign in first" — and `specs/2026-08-13-auth`
  // requires the visitor to arrive at /sign-in. Redirecting explicitly also
  // carries them back to the page they asked for once they are signed in.
  if (!userId) {
    return redirectToSignIn({ returnBackUrl: request.url });
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
