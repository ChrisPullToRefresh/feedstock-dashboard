import { CounterpartyLink } from "@/components/counterparty-link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Direction } from "@/generated/prisma/enums";
import {
  COUNTERPARTY_BASE_PATH,
  DIRECTION_LABEL,
  formatRecordedAt,
} from "@/lib/movement-data";
import type { ListedMovement } from "@/lib/movement-queries";
import { formatWeightKg } from "@/lib/weight";

/**
 * The movement table, at both widths.
 *
 * Exactly what `reference-list.tsx` does, for the reason recorded there: the
 * stacked rows are the primary layout and the table is what replaces them once
 * there is room. Both render the same rows from the same array — one design at
 * two widths, not two designs.
 *
 * A single table scrolling sideways on a phone was declined, because
 * horizontal scrolling is what `specs/tech-stack.md` § Responsive strategy
 * exists to avoid; so was dropping columns at narrow widths, which would make
 * information disappear with no way to reach it on the surface a manager is
 * most likely to open on a phone.
 *
 * Nothing here writes. `specs/mission.md` § Constraints makes movements
 * immutable, so there is no edit control, no delete control and no row action
 * — that is the rule, not a limitation of this phase.
 */

/** The counterparty a row carries, and where its detail page is.
 *
 * Which of the two columns is present is decided by `direction`, never by
 * which one happens to be filled: Phase 2's check constraint pairs inbound
 * with a producer and outbound with a sequestration site. The null case is
 * unreachable through that constraint, and is handled rather than asserted
 * away so a row can never take the whole page down with it. */
export function counterpartyOf(movement: ListedMovement) {
  const counterparty =
    movement.direction === Direction.INBOUND
      ? movement.producer
      : movement.sequestrationSite;

  if (counterparty === null) return null;

  return {
    ...counterparty,
    href: `${COUNTERPARTY_BASE_PATH[movement.direction]}/${counterparty.id}`,
  };
}

/** One row's four readings, so the stacked layout and the table cannot
 * disagree about what a movement says. */
function readingsOf(movement: ListedMovement) {
  return {
    recordedAt: formatRecordedAt(movement.recordedAt),
    direction: DIRECTION_LABEL[movement.direction],
    counterparty: counterpartyOf(movement),
    weight: `${formatWeightKg(movement.weightKg)} kg`,
  };
}

export function MovementList({
  movements,
}: {
  movements: readonly ListedMovement[];
}) {
  return (
    <>
      {/* Phone: every column earns its line, or the card gets tall. */}
      <ul className="flex flex-col gap-2 md:hidden">
        {movements.map((movement) => {
          const reading = readingsOf(movement);

          return (
            <li
              key={movement.id}
              className="rounded-md border px-4 py-3 text-sm"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{reading.direction}</span>
                <span className="font-medium tabular-nums">
                  {reading.weight}
                </span>
              </div>
              <div className="mt-1">
                {reading.counterparty === null ? null : (
                  <CounterpartyLink {...reading.counterparty} />
                )}
              </div>
              <div className="text-muted-foreground mt-1 tabular-nums">
                {reading.recordedAt}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Desktop: the same rows, in the room a table needs. */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recorded</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Counterparty</TableHead>
              {/* Right-aligned and tabular, which is why Inter was chosen —
                  specs/tech-stack.md § Application, "so columns of weights
                  align". */}
              <TableHead className="text-right">Weight (kg)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((movement) => {
              const reading = readingsOf(movement);

              return (
                <TableRow key={movement.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap tabular-nums">
                    {reading.recordedAt}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {reading.direction}
                  </TableCell>
                  <TableCell>
                    {reading.counterparty === null ? null : (
                      <CounterpartyLink {...reading.counterparty} />
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {reading.weight}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
