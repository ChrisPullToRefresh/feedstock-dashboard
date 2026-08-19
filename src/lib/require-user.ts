import { auth } from "@clerk/nextjs/server";

/**
 * The session check every Server Action runs before it writes.
 *
 * `src/proxy.ts` already redirects an unauthenticated request, and it is still
 * the first line — this is the second. Next's own guidance is that the gate is
 * not enough on its own:
 *
 * > While Proxy can be useful for initial checks, it should not be your only
 * > line of defense in protecting your data.
 *
 * > Treat Server Actions with the same security considerations as
 * > public-facing API endpoints, and verify if the user is allowed to perform
 * > a mutation.
 *
 * — `node_modules/next/dist/docs/01-app/02-guides/authentication.md`
 *
 * What makes that concrete here is that the gate is one regular expression and
 * this project has already shipped two holes in it: `/producers/acme.co`
 * served at 200 unauthenticated, and then `/producers/x.svg/edit` for want of
 * a trailing `$` — both in `specs/roadmap.md` Phase 3. A third would no longer
 * leak a read, it would write a `movements` row, and Phase 2's append-only
 * trigger refuses the DELETE that would clean it up.
 *
 * `specs/tech-stack.md` § Auth models no roles, so there is nothing to check
 * beyond "is there a session". Every authenticated user may record movements
 * and manage reference data.
 */
export async function requireUser(): Promise<string> {
  const { userId } = await auth();

  if (!userId) {
    // Thrown, not returned. An unauthenticated caller reached a Server Action
    // that the gate should have stopped, so there is no form state worth
    // rendering — the request is not one a signed-out person can make through
    // the app at all.
    throw new Error("Not signed in");
  }

  return userId;
}
