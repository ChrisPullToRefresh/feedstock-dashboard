import type { Producer } from "@/lib/producers";

export function ProducerList({ producers }: { producers: Producer[] }) {
  if (producers.length === 0) {
    return <p>No producers yet.</p>;
  }

  return (
    <ul>
      {producers.map((producer) => (
        <li key={producer.id}>{producer.name}</li>
      ))}
    </ul>
  );
}
