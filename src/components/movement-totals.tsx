import {
  ArrowDownToLine,
  ArrowUpFromLine,
  type LucideIcon,
} from "lucide-react";

import { Direction } from "@/generated/prisma/enums";
import { DIRECTION_LABEL } from "@/lib/movement-data";
import {
  type MovementForTotals,
  totalInboundKg,
  totalOutboundKg,
} from "@/lib/totals";
import { formatWeightKg } from "@/lib/weight";

/**
 * The running totals above the movement table.
 *
 * They describe the filtered set, not the whole table —
 * `specs/2026-08-18-movement-list-and-totals/plan.md` § Decisions. Filter to
 * one producer and these are that producer's figures. A filtered table sitting
 * under totals that do not match it is how a report gets misread.
 *
 * Computed over every row the filters select rather than the rows on screen,
 * which is why the page runs a second query for them: a running total that
 * moved each time someone tapped **Show more** would not be a running total.
 *
 * No net figure. The roadmap asks for "inbound and outbound weight overall",
 * and in minus out would read as material currently on site, which it is not —
 * processing loss is not modeled anywhere in v0.1, and nothing defines what
 * the difference means. A manager who wants it computes it.
 */

function Total({
  icon: Icon,
  label,
  weightKg,
}: {
  icon: LucideIcon;
  label: string;
  weightKg: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Icon className="size-4 shrink-0" aria-hidden />
        {label}
      </div>
      {/* Tabular, so the two figures line up under each other on a phone and
          beside each other on a desktop. */}
      <div className="mt-1 text-2xl font-semibold tabular-nums">
        {weightKg} kg
      </div>
    </div>
  );
}

export function MovementTotals({
  movements,
}: {
  /** Every row the filters matched, not the page's worth. */
  movements: readonly MovementForTotals[];
}) {
  return (
    // Named, so the two figures are announced as a block of their own and are
    // not confused with the same numbers in a breakdown below.
    <section
      aria-label="Running totals"
      className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      {/* Both are always rendered. Under a direction filter the other reads
          0 kg rather than disappearing, so nobody reads a missing figure as an
          unknown one. */}
      <Total
        icon={ArrowDownToLine}
        label={DIRECTION_LABEL[Direction.INBOUND]}
        weightKg={formatWeightKg(totalInboundKg(movements))}
      />
      <Total
        icon={ArrowUpFromLine}
        label={DIRECTION_LABEL[Direction.OUTBOUND]}
        weightKg={formatWeightKg(totalOutboundKg(movements))}
      />
    </section>
  );
}
