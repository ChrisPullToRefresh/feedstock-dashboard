import { connection } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { list as listProducers } from "@/lib/producers";
import { create as createTransaction } from "@/lib/transactions";
import { IncomingEntryForm } from "@/components/IncomingEntryForm";

export default async function NewIncomingTransactionPage() {
  await connection();
  const producers = await listProducers();

  async function recordIncoming(input: {
    weightKg: number;
    producerId: number;
  }) {
    "use server";
    const { userId } = await auth();
    await createTransaction({
      direction: "in",
      weightKg: input.weightKg,
      producerId: input.producerId,
      siteId: null,
      recordedBy: userId!,
    });
    redirect("/transactions");
  }

  return (
    <div>
      <h1>Record incoming feedstock</h1>
      <IncomingEntryForm producers={producers} onSubmit={recordIncoming} />
    </div>
  );
}
