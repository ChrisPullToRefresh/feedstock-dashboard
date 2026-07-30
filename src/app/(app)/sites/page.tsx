import { connection } from "next/server";
import Link from "next/link";
import { list } from "@/lib/sequestrationSites";
import { SequestrationSiteList } from "@/components/SequestrationSiteList";

export default async function SitesPage() {
  await connection();
  const sites = await list();

  return (
    <div>
      <h1>Sequestration sites</h1>
      <Link href="/sites/new">New site</Link>
      <SequestrationSiteList sites={sites} />
    </div>
  );
}
