import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TransactionList } from "../TransactionList";
import type { TransactionListItem } from "../TransactionList";

describe("TransactionList", () => {
  it("renders one row per transaction with the correct direction, weight, and linked name", () => {
    const transactions: TransactionListItem[] = [
      {
        id: 1,
        direction: "in",
        weight_kg: "120.5",
        producer_id: 7,
        site_id: null,
        recorded_by: "user_123",
        created_at: "2026-07-30T00:00:00.000Z",
        producerName: "Acme Farms",
        siteName: null,
      },
      {
        id: 2,
        direction: "out",
        weight_kg: "98.25",
        producer_id: null,
        site_id: 4,
        recorded_by: "user_456",
        created_at: "2026-07-30T00:05:00.000Z",
        producerName: null,
        siteName: "Green Site",
      },
    ];
    render(<TransactionList transactions={transactions} />);

    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("in");
    expect(rows[0]).toHaveTextContent("120.5 kg");
    expect(rows[0]).toHaveTextContent("Acme Farms");
    expect(rows[1]).toHaveTextContent("out");
    expect(rows[1]).toHaveTextContent("98.25 kg");
    expect(rows[1]).toHaveTextContent("Green Site");
  });

  it("renders an empty state when given no transactions", () => {
    render(<TransactionList transactions={[]} />);

    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.getByText("No transactions yet.")).toBeInTheDocument();
  });
});
