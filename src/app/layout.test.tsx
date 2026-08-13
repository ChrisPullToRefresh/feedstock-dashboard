import { render } from "@testing-library/react";
import { isValidElement } from "react";
import { describe, expect, it, vi } from "vitest";

// next/font is compiled by Next's own loader, so it has to be stubbed here.
// The stub still lets us assert that the layout requests Inter and puts the
// class the loader hands back onto the document body.
const { interLoader } = vi.hoisted(() => ({
  interLoader: vi.fn(() => ({
    className: "__inter_className",
    variable: "__inter_variable",
  })),
}));

vi.mock("next/font/google", () => ({ Inter: interLoader }));

// No `next/navigation` stub: the root layout no longer renders the shell, so
// nothing under it reads the router. That absence is the point of the group.

// Clerk's provider opens a session and reads the publishable key, neither of
// which belongs in a unit test. The stub keeps the tree renderable and marks
// where the provider sits.
const { clerkProvider } = vi.hoisted(() => ({
  clerkProvider: vi.fn(({ children }: { children: React.ReactNode }) => (
    <div data-testid="clerk-provider">{children}</div>
  )),
}));

vi.mock("@clerk/nextjs", () => ({ ClerkProvider: clerkProvider }));

import RootLayout from "@/app/layout";

describe("RootLayout", () => {
  it("loads Inter through next/font and names Tailwind's sans token", () => {
    expect(interLoader).toHaveBeenCalledWith(
      expect.objectContaining({ subsets: ["latin"], variable: "--font-sans" }),
    );
  });

  it("applies the Inter font class to the document body", () => {
    // React treats <html> and <body> as document singletons: rendering the
    // layout applies its props to the real document elements.
    render(
      <RootLayout>
        <p>Facility</p>
      </RootLayout>,
    );

    expect(document.body).toHaveClass("__inter_className");
    expect(document.documentElement).toHaveClass("__inter_variable");
  });

  it("wraps the whole document in Clerk's provider", () => {
    // Every route sits under this, `/sign-in` included — the sign-in surface
    // needs the provider as much as the protected pages do.
    //
    // The assertion is on what the provider was handed, not on rendered text:
    // React treats <html> and <body> as document singletons, so children land
    // in the real document rather than inside the stub's own element.
    // Earlier tests in this file render the same layout, and the stub keeps
    // its calls. A blanket clearAllMocks would wipe the import-time Inter call
    // the first test asserts on, so clear just this one.
    clerkProvider.mockClear();

    render(
      <RootLayout>
        <p>Facility</p>
      </RootLayout>,
    );

    expect(clerkProvider).toHaveBeenCalledOnce();

    const { children } = clerkProvider.mock.calls[0][0];

    if (!isValidElement(children)) {
      throw new Error("the provider was handed no element to wrap");
    }

    expect(children.type).toBe("html");
  });

  it("renders no navigation, so routes outside the (app) group have none", () => {
    // `/sign-in` renders through this layout and not the group's. If the shell
    // ever moves back up here, a signed-out visitor gets a tab bar whose every
    // destination redirects them back to signing in.
    const { queryByRole } = render(
      <RootLayout>
        <p>Facility</p>
      </RootLayout>,
    );

    expect(queryByRole("navigation")).not.toBeInTheDocument();
  });
});
