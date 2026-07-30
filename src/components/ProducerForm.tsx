"use client";

import { useState, useTransition } from "react";

export function ProducerForm({
  onCreate,
}: {
  onCreate: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required");
      return;
    }
    setError(null);
    startTransition(async () => {
      await onCreate(trimmed);
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="producer-name">Name</label>
      <input
        id="producer-name"
        name="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={isPending}>
        Create producer
      </button>
    </form>
  );
}
