import { redirect } from "next/navigation";
import { create } from "@/lib/producers";
import { getUserRole } from "@/lib/roles";
import { ProducerForm } from "@/components/ProducerForm";

export default async function NewProducerPage() {
  const role = await getUserRole();
  if (role !== "admin") {
    redirect("/producers?forbidden=1");
  }

  async function createProducer(name: string) {
    "use server";
    if ((await getUserRole()) !== "admin") {
      throw new Error("Only admins can create producers");
    }
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
