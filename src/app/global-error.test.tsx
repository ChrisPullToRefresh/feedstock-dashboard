import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import GlobalError from "@/app/global-error";

describe("GlobalError", () => {
  it("offers a retry that calls Next's reset", () => {
    const reset = vi.fn();

    render(<GlobalError error={new Error("boom")} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(reset).toHaveBeenCalledOnce();
  });

  it("shows the digest for correlating with the server log, and never the message", () => {
    const error = Object.assign(new Error("connection string leaked here"), {
      digest: "1170283996",
    });

    render(<GlobalError error={error} reset={vi.fn()} />);

    expect(screen.getByText(/1170283996/)).toBeVisible();
    expect(screen.queryByText(/connection string/)).not.toBeInTheDocument();
  });

  it("carries its own colors rather than the theme's tokens", () => {
    // It replaces the root layout, so globals.css and Inter are not loaded —
    // a token reference here would render as an unstyled page.
    render(<GlobalError error={new Error("boom")} reset={vi.fn()} />);

    const button = screen.getByRole("button", { name: "Try again" });

    expect(button.getAttribute("style")).not.toContain("var(--");
    expect(document.body.getAttribute("style")).not.toContain("var(--");
  });
});
