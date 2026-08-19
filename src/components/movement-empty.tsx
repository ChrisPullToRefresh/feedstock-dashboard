import { ArrowLeftRight, FilterX } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { CLEARED_FILTERS_HREF } from "@/lib/movement-data";

/**
 * The two ways this page can have nothing to show.
 *
 * They are not one screen, because they do not have the same way out —
 * `specs/2026-08-18-movement-list-and-totals/plan.md` § Decisions. One empty
 * state for both was declined: someone who had filtered into a corner would be
 * told the facility has no movements, which is false and offers no way back.
 * An empty table with a caption line was declined too — a dead end with no
 * action, on the app's landing page.
 *
 * Both are the shadcn `Empty`, as `reference-list.tsx` and Phase 5's record
 * routes already render.
 */

/** Nothing has been recorded at all. The way out is to record something. */
export function NoMovementsYet() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ArrowLeftRight />
        </EmptyMedia>
        <EmptyTitle>No movements yet</EmptyTitle>
        <EmptyDescription>
          Every load of feedstock in and out of the facility is listed here,
          with running totals. Record the first one to fill this page.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link href="/record">Record a movement</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}

/** There are movements; these filters reach none of them. The way out is to
 * widen the filters, not to record anything. */
export function NoMovementsMatch() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FilterX />
        </EmptyMedia>
        <EmptyTitle>No movements match these filters</EmptyTitle>
        <EmptyDescription>
          There are movements recorded, but none with this combination of
          direction, producer and sequestration site.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link href={CLEARED_FILTERS_HREF}>Clear filters</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
