import { connection } from "next/server";
import Link from "next/link";
import { list } from "@/lib/sequestrationSites";
import { getUserRole } from "@/lib/roles";
import { SequestrationSiteList } from "@/components/SequestrationSiteList";

export default async function SitesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await connection();
  const [sites, role, { forbidden }] = await Promise.all([
    list(),
    getUserRole(),
    searchParams,
  ]);

  return (
    <div>
      <h1>Sequestration sites</h1>
      {forbidden && (
        <p role="alert">You don&apos;t have permission to create sites.</p>
      )}
      {role === "admin" && <Link href="/sites/new">New site</Link>}
      <SequestrationSiteList sites={sites} />
    </div>
  );
}
