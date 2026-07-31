import { connection } from "next/server";
import Link from "next/link";
import { list } from "@/lib/producers";
import { getUserRole } from "@/lib/roles";
import { ProducerList } from "@/components/ProducerList";

export default async function ProducersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await connection();
  const [producers, role, { forbidden }] = await Promise.all([
    list(),
    getUserRole(),
    searchParams,
  ]);

  return (
    <div>
      <h1>Producers</h1>
      {forbidden && (
        <p role="alert">You don&apos;t have permission to create producers.</p>
      )}
      {role === "admin" && <Link href="/producers/new">New producer</Link>}
      <ProducerList producers={producers} />
    </div>
  );
}
