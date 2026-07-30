import { redirect } from "next/navigation";
import { create } from "@/lib/sequestrationSites";
import { SequestrationSiteForm } from "@/components/SequestrationSiteForm";

export default function NewSitePage() {
  async function createSite(name: string) {
    "use server";
    await create(name);
    redirect("/sites");
  }

  return (
    <div>
      <h1>New sequestration site</h1>
      <SequestrationSiteForm onCreate={createSite} />
    </div>
  );
}
