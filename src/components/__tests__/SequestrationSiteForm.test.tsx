import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SequestrationSiteForm } from "../SequestrationSiteForm";

describe("SequestrationSiteForm", () => {
  it("renders a name field", () => {
    render(<SequestrationSiteForm onCreate={vi.fn()} />);

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });

  it("rejects submission with an empty name, with the error on the name field", () => {
    const onCreate = vi.fn();
    render(<SequestrationSiteForm onCreate={onCreate} />);

    fireEvent.click(screen.getByRole("button", { name: "Create site" }));

    expect(screen.getByLabelText("Name")).toHaveAccessibleDescription(
      "Name is required"
    );
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("calls onCreate with a trimmed name on valid submission", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<SequestrationSiteForm onCreate={onCreate} />);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "  Deep Well Site  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create site" }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith("Deep Well Site");
    });
  });

  it("surfaces a submit-failure message when onCreate rejects", async () => {
    const onCreate = vi.fn().mockRejectedValue(new Error("db unavailable"));
    render(<SequestrationSiteForm onCreate={onCreate} />);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Deep Well Site" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create site" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Something went wrong — try again"
      );
    });
  });
});
