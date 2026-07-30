"use client";

import { useState, useTransition } from "react";

export function SequestrationSiteForm({
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
      <label htmlFor="site-name">Name</label>
      <input
        id="site-name"
        name="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={isPending}>
        Create site
      </button>
    </form>
  );
}
