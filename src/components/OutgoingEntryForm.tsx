"use client";

import { useState, useTransition } from "react";
import type { SequestrationSite } from "@/lib/sequestrationSites";
import styles from "./EntryForm.module.css";

export function OutgoingEntryForm({
  sites,
  onSubmit,
}: {
  sites: SequestrationSite[];
  onSubmit: (input: { weightKg: number; siteId: number }) => Promise<void>;
}) {
  const [weight, setWeight] = useState("");
  const [siteId, setSiteId] = useState("");
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
    if (!siteId) {
      setError("Site is required");
      return;
    }

    setError(null);
    startTransition(async () => {
      await onSubmit({ weightKg, siteId: Number(siteId) });
    });
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="outgoing-weight">
          Weight (kg)
        </label>
        <input
          id="outgoing-weight"
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
        <label className={styles.label} htmlFor="outgoing-site">
          Sequestration site
        </label>
        <select
          id="outgoing-site"
          name="siteId"
          className={styles.select}
          value={siteId}
          onChange={(event) => setSiteId(event.target.value)}
        >
          <option value="">Select a site</option>
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
      </div>
      {error && <p role="alert">{error}</p>}
      <button type="submit" className={styles.submit} disabled={isPending}>
        Record outgoing feedstock
      </button>
    </form>
  );
}
