import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { signIn } = vi.hoisted(() => ({
  signIn: vi.fn(() => <div data-testid="clerk-sign-in" />),
}));

vi.mock("@clerk/nextjs", () => ({ SignIn: signIn }));

import SignInPage from "@/app/sign-in/[[...sign-in]]/page";
import { clerkAppearance } from "@/lib/clerk-appearance";

describe("SignInPage", () => {
  it("renders Clerk's sign-in surface", () => {
    render(<SignInPage />);

    expect(screen.getByTestId("clerk-sign-in")).toBeVisible();
  });

  it("hands Clerk the theme's own tokens", () => {
    render(<SignInPage />);

    expect(signIn).toHaveBeenCalledWith(
      expect.objectContaining({ appearance: clerkAppearance }),
      undefined,
    );
  });
});

describe("clerkAppearance", () => {
  it("references theme variables rather than literal colors", () => {
    // Literals would pin the sign-in surface to one theme: the palette is
    // chosen by prefers-color-scheme at render time, not at build time.
    const colors = Object.entries(clerkAppearance.variables ?? {}).filter(
      ([name]) => name.startsWith("color"),
    );

    expect(colors.length).toBeGreaterThan(0);

    for (const [name, value] of colors) {
      expect(String(value), `${name} must come from a token`).toMatch(
        /^var\(--[\w-]+\)$/,
      );
    }
  });
});
