import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AppError from "@/app/error";

describe("AppError", () => {
  it("offers a retry that calls Next's reset", () => {
    const reset = vi.fn();

    render(<AppError error={new Error("boom")} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(reset).toHaveBeenCalledOnce();
  });

  it("shows the digest for correlating with the server log, and never the message", () => {
    const error = Object.assign(new Error("connection string leaked here"), {
      digest: "3891277236",
    });

    render(<AppError error={error} reset={vi.fn()} />);

    expect(screen.getByText(/3891277236/)).toBeVisible();
    expect(screen.queryByText(/connection string/)).not.toBeInTheDocument();
  });
});
