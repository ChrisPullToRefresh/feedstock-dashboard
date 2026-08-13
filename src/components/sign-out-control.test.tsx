import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { signOut, auth } = vi.hoisted(() => ({
  signOut: vi.fn(),
  // `isSignedIn` is undefined until Clerk resolves the session, which is a
  // third state the control has to handle, not a boolean.
  auth: { isSignedIn: undefined as boolean | undefined },
}));

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ isSignedIn: auth.isSignedIn, signOut }),
}));

import { SignOutControl } from "@/components/sign-out-control";

describe("SignOutControl", () => {
  beforeEach(() => {
    signOut.mockClear();
  });

  it("renders exactly one control for a signed-in user", () => {
    auth.isSignedIn = true;

    render(<SignOutControl />);

    // The count is the point: two copies for two viewports is the pattern
    // Phase 0 avoided so that each control has exactly one accessible name.
    expect(screen.getAllByRole("button", { name: "Sign out" })).toHaveLength(1);
  });

  it("signs out and returns to the sign-in route", () => {
    auth.isSignedIn = true;

    render(<SignOutControl />);
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(signOut).toHaveBeenCalledWith({ redirectUrl: "/sign-in" });
  });

  it("renders nothing for a signed-out visitor", () => {
    auth.isSignedIn = false;

    render(<SignOutControl />);

    expect(
      screen.queryByRole("button", { name: "Sign out" }),
    ).not.toBeInTheDocument();
  });

  it("renders nothing while the session is still resolving", () => {
    auth.isSignedIn = undefined;

    render(<SignOutControl />);

    expect(
      screen.queryByRole("button", { name: "Sign out" }),
    ).not.toBeInTheDocument();
  });
});
