import { CounterpartyLink } from "@/components/counterparty-link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CounterpartyTotal } from "@/lib/totals";
import { formatWeightKg } from "@/lib/weight";

/**
 * One breakdown: where the filtered weight came from, or where it went.
 *
 * Rendered twice below the movement table — inbound by producer, outbound by
 * sequestration site. Putting them only on the detail pages was declined,
 * because `specs/roadmap.md` asks for totals "broken down by producer and by
 * sequestration site" and no single screen would then show that breakdown.
 *
 * Rows arrive already ranked by `rankCounterpartyTotals`: heaviest first, ties
 * broken by name so the order is stable between renders. Name order was
 * declined — it matches the two reference lists, but it buries the answer the
 * breakdown exists to give.
 *
 * Two columns, so nothing has to scroll sideways on a phone. The props are
 * individual rather than a per-entity config object, so the words stay next to
 * the screen they appear on — the shape `reference-list.tsx` set in Phase 4.
 */
export function MovementBreakdown({
  heading,
  columnLabel,
  rows,
  basePath,
  emptyMessage,
}: {
  heading: string;
  /** What the first column names — "Producer", "Sequestration site". */
  columnLabel: string;
  rows: readonly CounterpartyTotal[];
  /** Where a name links to — `/producers`, `/sites`. */
  basePath: string;
  emptyMessage: string;
}) {
  return (
    // Named from its own heading, so each breakdown is announced as a block and
    // a weight in one is never read as a weight in the other.
    <section aria-label={heading}>
      <h2 className="mb-3 text-lg font-semibold tracking-tight">{heading}</h2>

      {rows.length === 0 ? (
        // Its own line rather than a bare heading, which would read as a
        // breakdown that failed to load.
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{columnLabel}</TableHead>
              <TableHead className="text-right">Weight (kg)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <CounterpartyLink
                    href={`${basePath}/${row.id}`}
                    name={row.name}
                    isActive={row.isActive}
                  />
                </TableCell>
                <TableCell className="text-right font-medium whitespace-nowrap tabular-nums">
                  {formatWeightKg(row.totalKg)} kg
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
