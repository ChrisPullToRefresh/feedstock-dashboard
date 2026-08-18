import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MovementTotals } from "@/components/movement-totals";
import { Prisma } from "@/generated/prisma/client";
import { Direction } from "@/generated/prisma/enums";
import type { MovementForTotals } from "@/lib/totals";

const inbound = (weightKg: string): MovementForTotals => ({
  direction: Direction.INBOUND,
  weightKg: new Prisma.Decimal(weightKg),
  producerId: "producer_a",
  sequestrationSiteId: null,
});

const outbound = (weightKg: string): MovementForTotals => ({
  direction: Direction.OUTBOUND,
  weightKg: new Prisma.Decimal(weightKg),
  producerId: null,
  sequestrationSiteId: "site_x",
});

/** validation.md § Manual steps 2 to 4 record exactly this and read
 * 2,350.5 kg in and 1,150 kg out off the screen. */
const THE_MANUAL_PASS = [
  inbound("1250.5"),
  inbound("800"),
  inbound("300"),
  outbound("900"),
  outbound("250"),
];

describe("the running totals", () => {
  it("renders both figures from the rows it was given", () => {
    render(<MovementTotals movements={THE_MANUAL_PASS} />);

    expect(screen.getByText("2,350.5 kg")).toBeVisible();
    expect(screen.getByText("1,150 kg")).toBeVisible();
  });

  it("labels them in the yard's words", () => {
    render(<MovementTotals movements={THE_MANUAL_PASS} />);

    expect(screen.getByText("Feedstock in")).toBeVisible();
    expect(screen.getByText("Feedstock out")).toBeVisible();
  });

  it("leaves the other total at zero under a direction filter", () => {
    // Rather than hiding it. A missing figure reads as an unknown one, and the
    // page would change shape depending on which filter is set.
    render(
      <MovementTotals
        movements={THE_MANUAL_PASS.filter(
          (movement) => movement.direction === Direction.INBOUND,
        )}
      />,
    );

    expect(screen.getByText("2,350.5 kg")).toBeVisible();
    expect(screen.getByText("0 kg")).toBeVisible();
  });

  it("renders zeroes rather than nothing when no rows match", () => {
    render(<MovementTotals movements={[]} />);

    expect(screen.getAllByText("0 kg")).toHaveLength(2);
  });

  it("renders no net figure", () => {
    // The roadmap asks for inbound and outbound weight, and in minus out would
    // read as material currently on site, which it is not.
    render(<MovementTotals movements={THE_MANUAL_PASS} />);

    expect(screen.queryByText(/net/i)).not.toBeInTheDocument();
    // 2,350.5 - 1,150. Nothing on the page may be that number.
    expect(screen.queryByText(/1,200\.5/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/ kg$/)).toHaveLength(2);
  });

  it("keeps the total exact to the gram", () => {
    render(
      <MovementTotals movements={[inbound("1250.5"), inbound("0.001")]} />,
    );

    // No total is rounded on its way to the page — requirements.md.
    expect(screen.getByText("1,250.501 kg")).toBeVisible();
  });
});
