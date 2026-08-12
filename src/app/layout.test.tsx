import { render } from "@testing-library/react";
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

// The shell inside the layout reads the current path from the router.
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

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
});
