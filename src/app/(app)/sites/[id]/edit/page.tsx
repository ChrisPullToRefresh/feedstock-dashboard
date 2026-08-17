import { notFound } from "next/navigation";

import { renameSite, restoreSite } from "@/app/(app)/sites/actions";
import { ReferenceForm } from "@/components/reference-form";
import { SEQUESTRATION_SITE_SINGULAR } from "@/lib/reference-data";
import { findSite } from "@/lib/site-queries";

export default async function EditSitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const site = await findSite(id);

  // Includes an archived site reached by its id. Nothing links there, but a
  // stale tab or a bookmark can, and editing one is harmless.
  if (!site) notFound();

  return (
    <section className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        Edit sequestration site
      </h1>
      <ReferenceForm
        singular={SEQUESTRATION_SITE_SINGULAR}
        // Bound rather than passed through a hidden field: the id decides which
        // row is written, so it must not be something the browser can change.
        action={renameSite.bind(null, site.id)}
        defaultName={site.name}
        restore={restoreSite}
        submitLabel="Save changes"
      />
    </section>
  );
}
