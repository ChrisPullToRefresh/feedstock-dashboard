import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ProducerForm } from "../ProducerForm";

describe("ProducerForm", () => {
  it("renders a name field", () => {
    render(<ProducerForm onCreate={vi.fn()} />);

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });

  it("rejects submission with an empty name, with the error on the name field", () => {
    const onCreate = vi.fn();
    render(<ProducerForm onCreate={onCreate} />);

    fireEvent.click(screen.getByRole("button", { name: "Create producer" }));

    expect(screen.getByLabelText("Name")).toHaveAccessibleDescription(
      "Name is required"
    );
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("calls onCreate with a trimmed name on valid submission", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<ProducerForm onCreate={onCreate} />);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "  Acme Farms  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create producer" }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith("Acme Farms");
    });
  });

  it("surfaces a submit-failure message when onCreate rejects", async () => {
    const onCreate = vi.fn().mockRejectedValue(new Error("db unavailable"));
    render(<ProducerForm onCreate={onCreate} />);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Acme Farms" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create producer" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Something went wrong — try again"
      );
    });
  });
});
