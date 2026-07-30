import { connection } from "next/server";
import Link from "next/link";
import { list } from "@/lib/producers";
import { ProducerList } from "@/components/ProducerList";

export default async function ProducersPage() {
  await connection();
  const producers = await list();

  return (
    <div>
      <h1>Producers</h1>
      <Link href="/producers/new">New producer</Link>
      <ProducerList producers={producers} />
    </div>
  );
}
