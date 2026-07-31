import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { OutgoingEntryForm } from "../OutgoingEntryForm";
import type { SequestrationSite } from "@/lib/sequestrationSites";

const sites: SequestrationSite[] = [
  { id: 1, name: "Deep Site", created_at: "2026-07-01T00:00:00.000Z" },
  { id: 2, name: "Coastal Site", created_at: "2026-07-02T00:00:00.000Z" },
];

describe("OutgoingEntryForm", () => {
  it("renders the site dropdown populated from the given site list", () => {
    render(<OutgoingEntryForm sites={sites} onSubmit={vi.fn()} />);

    const select = screen.getByLabelText("Sequestration site");
    expect(select).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Deep Site" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Coastal Site" })
    ).toBeInTheDocument();
  });

  it("rejects submission when weight is empty, with the error on the weight field", () => {
    const onSubmit = vi.fn();
    render(<OutgoingEntryForm sites={sites} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Sequestration site"), {
      target: { value: "1" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Record outgoing feedstock" })
    );

    expect(screen.getByLabelText("Weight (kg)")).toHaveAccessibleDescription(
      "Weight is required and must be a number"
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects submission when weight is non-numeric, with the error on the weight field", () => {
    const onSubmit = vi.fn();
    render(<OutgoingEntryForm sites={sites} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Weight (kg)"), {
      target: { value: "abc" },
    });
    fireEvent.change(screen.getByLabelText("Sequestration site"), {
      target: { value: "1" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Record outgoing feedstock" })
    );

    expect(screen.getByLabelText("Weight (kg)")).toHaveAccessibleDescription(
      "Weight is required and must be a number"
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects submission when weight is zero or negative, with the error on the weight field", () => {
    const onSubmit = vi.fn();
    render(<OutgoingEntryForm sites={sites} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Weight (kg)"), {
      target: { value: "0" },
    });
    fireEvent.change(screen.getByLabelText("Sequestration site"), {
      target: { value: "1" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Record outgoing feedstock" })
    );

    expect(screen.getByLabelText("Weight (kg)")).toHaveAccessibleDescription(
      "Weight must be greater than zero"
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects submission when no site is selected, with the error on the site field", () => {
    const onSubmit = vi.fn();
    render(<OutgoingEntryForm sites={sites} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Weight (kg)"), {
      target: { value: "98.25" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Record outgoing feedstock" })
    );

    expect(screen.getByLabelText("Sequestration site")).toHaveAccessibleDescription(
      "Site is required"
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with the weight and site id on valid submission", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<OutgoingEntryForm sites={sites} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Weight (kg)"), {
      target: { value: "98.25" },
    });
    fireEvent.change(screen.getByLabelText("Sequestration site"), {
      target: { value: "2" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Record outgoing feedstock" })
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ weightKg: 98.25, siteId: 2 });
    });
  });

  it("surfaces a submit-failure message when onSubmit rejects", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("db unavailable"));
    render(<OutgoingEntryForm sites={sites} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Weight (kg)"), {
      target: { value: "98.25" },
    });
    fireEvent.change(screen.getByLabelText("Sequestration site"), {
      target: { value: "2" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Record outgoing feedstock" })
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Something went wrong — try again"
      );
    });
  });
});
