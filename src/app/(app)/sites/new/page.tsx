import { createSite, restoreSite } from "@/app/(app)/sites/actions";
import { ReferenceForm } from "@/components/reference-form";
import { SEQUESTRATION_SITE_SINGULAR } from "@/lib/reference-data";

export default function NewSitePage() {
  return (
    <section className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        Add sequestration site
      </h1>
      <ReferenceForm
        singular={SEQUESTRATION_SITE_SINGULAR}
        action={createSite}
        restore={restoreSite}
        submitLabel="Create sequestration site"
      />
    </section>
  );
}
