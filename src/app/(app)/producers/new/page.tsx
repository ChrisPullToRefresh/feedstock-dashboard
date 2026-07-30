import { redirect } from "next/navigation";
import { create } from "@/lib/producers";
import { ProducerForm } from "@/components/ProducerForm";

export default function NewProducerPage() {
  async function createProducer(name: string) {
    "use server";
    await create(name);
    redirect("/producers");
  }

  return (
    <div>
      <h1>New producer</h1>
      <ProducerForm onCreate={createProducer} />
    </div>
  );
}
