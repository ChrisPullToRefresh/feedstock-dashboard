"use client";

import { useState, useTransition } from "react";
import type { Producer } from "@/lib/producers";
import styles from "./EntryForm.module.css";

export function IncomingEntryForm({
  producers,
  onSubmit,
}: {
  producers: Producer[];
  onSubmit: (input: { weightKg: number; producerId: number }) => Promise<void>;
}) {
  const [weight, setWeight] = useState("");
  const [producerId, setProducerId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedWeight = weight.trim();
    const weightKg = Number(trimmedWeight);
    if (!trimmedWeight || Number.isNaN(weightKg)) {
      setError("Weight is required and must be a number");
      return;
    }
    if (!producerId) {
      setError("Producer is required");
      return;
    }

    setError(null);
    startTransition(async () => {
      await onSubmit({ weightKg, producerId: Number(producerId) });
    });
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="incoming-weight">
          Weight (kg)
        </label>
        <input
          id="incoming-weight"
          name="weight"
          type="number"
          inputMode="decimal"
          step="any"
          className={styles.input}
          value={weight}
          onChange={(event) => setWeight(event.target.value)}
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="incoming-producer">
          Producer
        </label>
        <select
          id="incoming-producer"
          name="producerId"
          className={styles.select}
          value={producerId}
          onChange={(event) => setProducerId(event.target.value)}
        >
          <option value="">Select a producer</option>
          {producers.map((producer) => (
            <option key={producer.id} value={producer.id}>
              {producer.name}
            </option>
          ))}
        </select>
      </div>
      {error && <p role="alert">{error}</p>}
      <button type="submit" className={styles.submit} disabled={isPending}>
        Record incoming feedstock
      </button>
    </form>
  );
}
