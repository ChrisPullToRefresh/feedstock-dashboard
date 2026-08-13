import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// The shell reads the current path from the router.
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

// And its header reads Clerk's session; this test is about the shell being
// present at all, not about who is signed in.
vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ isSignedIn: false, signOut: vi.fn() }),
}));

import AppLayout from "@/app/(app)/layout";

describe("AppLayout", () => {
  it("wraps its routes in the shell", () => {
    render(
      <AppLayout>
        <p>Facility</p>
      </AppLayout>,
    );

    expect(screen.getByRole("navigation", { name: "Main" })).toBeVisible();
    expect(screen.getByText("Facility")).toBeVisible();
  });
});
