"use client";

import { useAuth } from "@clerk/nextjs";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * A shadcn Button, not Clerk's `<UserButton />`. The Clerk exception recorded in
 * `specs/2026-08-13-auth/plan.md` § Decisions is justified by authentication
 * being a protocol rather than a widget — signing out is one function call, so
 * the exception does not stretch to cover it, and the shell stays shadcn.
 *
 * Named `SignOutControl` rather than `SignOutButton` because `@clerk/nextjs`
 * exports a component by the latter name; two things with one name in the same
 * import namespace is a mistake waiting to be made.
 *
 * `isSignedIn` is `undefined` until Clerk resolves the session, so the single
 * falsy check covers loading and signed-out alike and the control never flashes
 * in front of a visitor who has no session.
 */
export function SignOutControl() {
  const { isSignedIn, signOut } = useAuth();

  if (!isSignedIn) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => signOut({ redirectUrl: "/sign-in" })}
    >
      <LogOut aria-hidden="true" />
      Sign out
    </Button>
  );
}
