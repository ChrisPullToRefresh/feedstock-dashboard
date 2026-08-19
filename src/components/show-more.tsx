import Link from "next/link";

import { Button } from "@/components/ui/button";
import { showMoreHref, type MovementFilters } from "@/lib/movement-data";

/**
 * The next hundred rows.
 *
 * A `Link` to the same URL with `limit` raised, not a fetch-and-append —
 * `specs/2026-08-18-movement-list-and-totals/plan.md` § Decisions. A client
 * fetch would stop the loaded set being described by the URL and would need a
 * loading state to build and test; a cursor keyed to the oldest loaded row
 * pages correctly as new movements land, but wants client state to accumulate
 * them, which is more machinery than a growing limit.
 *
 * The cost accepted: a full round trip and a re-render per tap, and scroll
 * position is not preserved across one.
 *
 * Rendered only when `listMovements` returned more rows than the limit. The
 * caller decides that from `pageAtLimit`, which reads the one extra row the
 * query took for exactly this purpose.
 */
export function ShowMore({ filters }: { filters: MovementFilters }) {
  return (
    <div className="mt-4 flex justify-center">
      <Button asChild variant="outline" className="w-full sm:w-auto">
        <Link href={showMoreHref(filters)}>Show more</Link>
      </Button>
    </div>
  );
}
