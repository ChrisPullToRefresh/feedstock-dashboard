import { redirect } from "next/navigation";
import { create } from "@/lib/sequestrationSites";
import { getUserRole } from "@/lib/roles";
import { SequestrationSiteForm } from "@/components/SequestrationSiteForm";

export default async function NewSitePage() {
  const role = await getUserRole();
  if (role !== "admin") {
    redirect("/sites?forbidden=1");
  }

  async function createSite(name: string) {
    "use server";
    if ((await getUserRole()) !== "admin") {
      throw new Error("Only admins can create sequestration sites");
    }
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
