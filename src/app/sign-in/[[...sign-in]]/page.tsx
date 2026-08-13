import { SignIn } from "@clerk/nextjs";

import { clerkAppearance } from "@/lib/clerk-appearance";

/**
 * Deliberately outside the `(app)` group, so it renders without the shell —
 * every destination in that navigation redirects back here for a signed-out
 * visitor.
 *
 * There is no sign-up counterpart. `specs/mission.md` § Non-goals allows
 * internal staff only, and accounts are created through the Clerk Backend API;
 * see the README for the provisioning path.
 */
export default function SignInPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <SignIn appearance={clerkAppearance} />
    </main>
  );
}
