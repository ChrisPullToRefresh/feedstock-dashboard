import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { IncomingEntryForm } from "../IncomingEntryForm";
import type { Producer } from "@/lib/producers";

const producers: Producer[] = [
  { id: 1, name: "Acme Farms", created_at: "2026-07-01T00:00:00.000Z" },
  { id: 2, name: "Green Co", created_at: "2026-07-02T00:00:00.000Z" },
];

describe("IncomingEntryForm", () => {
  it("renders the producer dropdown populated from the given producer list", () => {
    render(<IncomingEntryForm producers={producers} onSubmit={vi.fn()} />);

    const select = screen.getByLabelText("Producer");
    expect(select).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Acme Farms" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Green Co" })).toBeInTheDocument();
  });

  it("rejects submission when weight is empty, with the error on the weight field", () => {
    const onSubmit = vi.fn();
    render(<IncomingEntryForm producers={producers} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Producer"), {
      target: { value: "1" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Record incoming feedstock" })
    );

    expect(screen.getByLabelText("Weight (kg)")).toHaveAccessibleDescription(
      "Weight is required and must be a number"
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects submission when weight is non-numeric, with the error on the weight field", () => {
    const onSubmit = vi.fn();
    render(<IncomingEntryForm producers={producers} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Weight (kg)"), {
      target: { value: "abc" },
    });
    fireEvent.change(screen.getByLabelText("Producer"), {
      target: { value: "1" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Record incoming feedstock" })
    );

    expect(screen.getByLabelText("Weight (kg)")).toHaveAccessibleDescription(
      "Weight is required and must be a number"
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects submission when weight is zero or negative, with the error on the weight field", () => {
    const onSubmit = vi.fn();
    render(<IncomingEntryForm producers={producers} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Weight (kg)"), {
      target: { value: "-5" },
    });
    fireEvent.change(screen.getByLabelText("Producer"), {
      target: { value: "1" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Record incoming feedstock" })
    );

    expect(screen.getByLabelText("Weight (kg)")).toHaveAccessibleDescription(
      "Weight must be greater than zero"
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects submission when no producer is selected, with the error on the producer field", () => {
    const onSubmit = vi.fn();
    render(<IncomingEntryForm producers={producers} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Weight (kg)"), {
      target: { value: "120.5" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Record incoming feedstock" })
    );

    expect(screen.getByLabelText("Producer")).toHaveAccessibleDescription(
      "Producer is required"
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with the weight and producer id on valid submission", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<IncomingEntryForm producers={producers} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Weight (kg)"), {
      target: { value: "120.5" },
    });
    fireEvent.change(screen.getByLabelText("Producer"), {
      target: { value: "2" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Record incoming feedstock" })
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ weightKg: 120.5, producerId: 2 });
    });
  });

  it("surfaces a submit-failure message when onSubmit rejects", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("db unavailable"));
    render(<IncomingEntryForm producers={producers} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Weight (kg)"), {
      target: { value: "120.5" },
    });
    fireEvent.change(screen.getByLabelText("Producer"), {
      target: { value: "2" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Record incoming feedstock" })
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Something went wrong — try again"
      );
    });
  });
});
