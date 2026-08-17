import { Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { archiveSite } from "@/app/(app)/sites/actions";
import { ArchiveDialog } from "@/components/archive-dialog";
import { Button } from "@/components/ui/button";
import { findSite } from "@/lib/site-queries";

export default async function SitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const site = await findSite(id);

  if (!site) notFound();

  return (
    <section className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold tracking-tight">{site.name}</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Outbound movements record the processed feedstock that went to this
        sequestration site.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button asChild variant="outline">
          <Link href={`/sites/${site.id}/edit`}>
            <Pencil />
            Edit
          </Link>
        </Button>

        <ArchiveDialog
          name={site.name}
          description="It stops appearing in the sequestration sites list and in the outbound movement dropdown. Its record and its movement history stay intact, and nothing is deleted."
          confirmLabel="Archive sequestration site"
          archive={archiveSite.bind(null, site.id)}
        />
      </div>
    </section>
  );
}
