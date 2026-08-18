import type { LucideIcon } from "lucide-react";
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

/**
 * What a record route shows when it has no counterparty to offer.
 *
 * A required dropdown with nothing in it is a dead end — the operator is told
 * to choose and given nothing to choose from, with no way to find out why.
 * `specs/2026-08-17-movement-entry/plan.md` § Decisions replaces the form
 * entirely rather than rendering one that cannot be completed.
 *
 * Shared by both directions so the two dead ends read the same. It takes
 * individual props rather than a config object, for the reason
 * `specs/2026-08-16-sequestration-sites/plan.md` § Decisions gives: the words
 * stay next to the screen they appear on.
 */
export function CounterpartyEmpty({
  icon: Icon,
  title,
  description,
  actionLabel,
  createPath,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  createPath: string;
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link href={createPath}>{actionLabel}</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
