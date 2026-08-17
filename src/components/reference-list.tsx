import { Plus, type LucideIcon } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** The fields this list reads. Structural, so a narrowed query fits. */
export type ListedReference = {
  id: string;
  name: string;
};

/**
 * A reference-data list, at both widths.
 *
 * `specs/tech-stack.md` § Application makes the phone the design and the
 * desktop the widening of it, so the stacked rows are the primary layout and
 * the table is what replaces them once there is room. Both render the same
 * rows from the same array — one design at two widths, not two designs.
 *
 * Archived rows never reach here: the list queries filter on `isActive` and no
 * screen lists them — `plan.md` § Decisions.
 *
 * Shared by producers and sequestration sites as of Phase 4. The props are
 * individual rather than a per-entity config object, so the words stay next to
 * the screen they appear on.
 */
export function ReferenceList({
  items,
  basePath,
  createPath,
  emptyIcon: EmptyIcon,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
}: {
  items: ListedReference[];
  /** Where a row links to — `/producers`, `/sites`. */
  basePath: string;
  createPath: string;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  emptyActionLabel: string;
}) {
  if (items.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <EmptyIcon />
          </EmptyMedia>
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          <EmptyDescription>{emptyDescription}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href={createPath}>{emptyActionLabel}</Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <>
      {/* Phone: each row is one large tap target. */}
      <ul className="flex flex-col gap-2 sm:hidden">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={`${basePath}/${item.id}`}
              className="hover:bg-accent flex min-h-12 items-center rounded-md border px-4 py-3 text-sm font-medium"
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>

      {/* Desktop: the same rows, in the room a table needs. */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Link
                    href={`${basePath}/${item.id}`}
                    className="font-medium hover:underline"
                  >
                    {item.name}
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

/** The heading and the create control that sit above a list at both widths. */
export function ReferenceListHeader({
  heading,
  createPath,
  createLabel,
}: {
  heading: string;
  createPath: string;
  createLabel: string;
}) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
      <Button asChild>
        <Link href={createPath}>
          <Plus />
          {createLabel}
        </Link>
      </Button>
    </div>
  );
}
