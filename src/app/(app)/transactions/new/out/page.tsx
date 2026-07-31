import { connection } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { list as listSites } from "@/lib/sequestrationSites";
import { create as createTransaction } from "@/lib/transactions";
import { OutgoingEntryForm } from "@/components/OutgoingEntryForm";

export default async function NewOutgoingTransactionPage() {
  await connection();
  const sites = await listSites();

  async function recordOutgoing(input: { weightKg: number; siteId: number }) {
    "use server";
    const { userId } = await auth();
    await createTransaction({
      direction: "out",
      weightKg: input.weightKg,
      producerId: null,
      siteId: input.siteId,
      recordedBy: userId!,
    });
    redirect("/transactions");
  }

  return (
    <div>
      <h1>Record outgoing feedstock</h1>
      <OutgoingEntryForm sites={sites} onSubmit={recordOutgoing} />
    </div>
  );
}
