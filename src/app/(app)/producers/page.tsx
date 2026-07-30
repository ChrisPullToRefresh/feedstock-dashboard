import Link from "next/link";
import { list } from "@/lib/producers";
import { ProducerList } from "@/components/ProducerList";

export default async function ProducersPage() {
  const producers = await list();

  return (
    <div>
      <h1>Producers</h1>
      <Link href="/producers/new">New producer</Link>
      <ProducerList producers={producers} />
    </div>
  );
}
