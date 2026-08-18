import Link from "next/link";

import { Badge } from "@/components/ui/badge";

/**
 * A counterparty's name, linked to its detail page and marked if it is
 * archived.
 *
 * One component because the name appears in three places on the movement list
 * — the table, the inbound breakdown and the outbound breakdown — and
 * `specs/2026-08-18-movement-list-and-totals/plan.md` § Decisions refuses to
 * have it be a link in one table and plain text in another a few hundred
 * pixels away.
 *
 * Archived counterparties are shown, not hidden: `specs/mission.md`
 * § Constraints keeps every movement's counterparty resolvable for the life of
 * the record, and `specs/roadmap.md` § After v0.1 defers managing them rather
 * than seeing them. The marker is what stops the name being read as something
 * the entry forms still offer.
 */
export function CounterpartyLink({
  href,
  name,
  isActive,
}: {
  href: string;
  name: string;
  isActive: boolean;
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Link href={href} className="font-medium hover:underline">
        {name}
      </Link>
      {isActive ? null : (
        <Badge variant="outline" className="font-normal">
          Archived
        </Badge>
      )}
    </span>
  );
}
