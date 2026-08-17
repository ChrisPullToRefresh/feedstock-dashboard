import { Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { archiveProducer } from "@/app/(app)/producers/actions";
import { ArchiveDialog } from "@/components/archive-dialog";
import { Button } from "@/components/ui/button";
import { findProducer } from "@/lib/producer-queries";

export default async function ProducerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const producer = await findProducer(id);

  if (!producer) notFound();

  return (
    <section className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold tracking-tight">{producer.name}</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Inbound movements record the feedstock that came from this producer.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button asChild variant="outline">
          <Link href={`/producers/${producer.id}/edit`}>
            <Pencil />
            Edit
          </Link>
        </Button>

        <ArchiveDialog
          name={producer.name}
          description="It stops appearing in the producers list and in the inbound movement dropdown. Its record and its movement history stay intact, and nothing is deleted."
          confirmLabel="Archive producer"
          archive={archiveProducer.bind(null, producer.id)}
        />
      </div>
    </section>
  );
}
