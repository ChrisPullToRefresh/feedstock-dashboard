import { Factory, Plus } from "lucide-react";
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

/** The producer fields this list reads. Structural, so a narrowed query fits. */
export type ListedProducer = {
  id: string;
  name: string;
};

/**
 * The producers list, at both widths.
 *
 * `specs/tech-stack.md` § Application makes the phone the design and the
 * desktop the widening of it, so the stacked rows are the primary layout and
 * the table is what replaces them once there is room. Both render the same
 * producers from the same array — one design at two widths, not two designs.
 *
 * Archived producers never reach here: `listActiveProducers` filters them out
 * and no screen lists them — `plan.md` § Decisions.
 */
export function ProducerList({ producers }: { producers: ListedProducer[] }) {
  if (producers.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Factory />
          </EmptyMedia>
          <EmptyTitle>No producers yet</EmptyTitle>
          <EmptyDescription>
            Feedstock producers are who inbound movements come from. Add one and
            it becomes available when recording an inbound movement.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/producers/new">Add the first producer</Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <>
      {/* Phone: each producer is one large tap target. */}
      <ul className="flex flex-col gap-2 sm:hidden">
        {producers.map((producer) => (
          <li key={producer.id}>
            <Link
              href={`/producers/${producer.id}`}
              className="hover:bg-accent flex min-h-12 items-center rounded-md border px-4 py-3 text-sm font-medium"
            >
              {producer.name}
            </Link>
          </li>
        ))}
      </ul>

      {/* Desktop: the same producers, in the room a table needs. */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {producers.map((producer) => (
              <TableRow key={producer.id}>
                <TableCell>
                  <Link
                    href={`/producers/${producer.id}`}
                    className="font-medium hover:underline"
                  >
                    {producer.name}
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

/** The heading and the create control that sit above the list at both widths. */
export function ProducerListHeader() {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Producers</h1>
      <Button asChild>
        <Link href="/producers/new">
          <Plus />
          Add producer
        </Link>
      </Button>
    </div>
  );
}
