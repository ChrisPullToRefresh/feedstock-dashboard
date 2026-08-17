import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/button";

/**
 * Proves shadcn/ui is wired: its variant classes reach the rendered DOM,
 * which means Tailwind and the theme tokens are in the chain.
 */
describe("Button", () => {
  it("applies the default variant classes", () => {
    render(<Button>Record movement</Button>);

    const button = screen.getByRole("button", { name: "Record movement" });

    expect(button).toHaveClass("bg-primary", "text-primary-foreground");
    expect(button).toHaveAttribute("data-variant", "default");
  });

  it("applies the outline variant classes instead of the default ones", () => {
    render(<Button variant="outline">Cancel</Button>);

    const button = screen.getByRole("button", { name: "Cancel" });

    expect(button).toHaveClass("border-border", "bg-background");
    expect(button).not.toHaveClass("bg-primary");
    expect(button).toHaveAttribute("data-variant", "outline");
  });

  it("applies the size variant classes", () => {
    render(<Button size="lg">Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });

    expect(button).toHaveClass("h-9");
    expect(button).toHaveAttribute("data-size", "lg");
  });
});

describe("the destructive variant", () => {
  it("puts its label on a solid fill rather than a tint of itself", () => {
    // The scaffold shipped `bg-destructive/10 text-destructive`, which put the
    // label on its own 10% fill: 4.39:1 in light and 3.16:1 in dark, against
    // WCAG 2.1 AA's 4.5:1 for the 14px label this button uses. A solid fill
    // with a theme-dependent foreground measures 4.76:1 and 6.84:1.
    render(<Button variant="destructive">Archive</Button>);

    const button = screen.getByRole("button", { name: "Archive" });

    expect(button).toHaveClass("bg-destructive");
    expect(button).toHaveClass("text-destructive-foreground");
    expect(button.className).not.toMatch(/bg-destructive\/\d/);
  });
});
