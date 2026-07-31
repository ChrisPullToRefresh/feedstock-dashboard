"use client";

import { useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import type { SequestrationSite } from "@/lib/sequestrationSites";
import styles from "./EntryForm.module.css";

type FieldErrors = {
  weight?: string;
  site?: string;
};

export function OutgoingEntryForm({
  sites,
  onSubmit,
}: {
  sites: SequestrationSite[];
  onSubmit: (input: { weightKg: number; siteId: number }) => Promise<void>;
}) {
  const [weight, setWeight] = useState("");
  const [siteId, setSiteId] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors: FieldErrors = {};
    const trimmedWeight = weight.trim();
    const weightKg = Number(trimmedWeight);
    if (!trimmedWeight || Number.isNaN(weightKg)) {
      errors.weight = "Weight is required and must be a number";
    } else if (weightKg <= 0) {
      errors.weight = "Weight must be greater than zero";
    }
    if (!siteId) {
      errors.site = "Site is required";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitError(null);
    startTransition(async () => {
      try {
        await onSubmit({ weightKg, siteId: Number(siteId) });
      } catch (err) {
        unstable_rethrow(err);
        setSubmitError("Something went wrong — try again");
      }
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
          aria-invalid={fieldErrors.weight ? true : undefined}
          aria-describedby={
            fieldErrors.weight ? "outgoing-weight-error" : undefined
          }
        />
        {fieldErrors.weight && (
          <p id="outgoing-weight-error" role="alert" className={styles.fieldError}>
            {fieldErrors.weight}
          </p>
        )}
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
          aria-invalid={fieldErrors.site ? true : undefined}
          aria-describedby={
            fieldErrors.site ? "outgoing-site-error" : undefined
          }
        >
          <option value="">Select a site</option>
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
        {fieldErrors.site && (
          <p id="outgoing-site-error" role="alert" className={styles.fieldError}>
            {fieldErrors.site}
          </p>
        )}
      </div>
      {submitError && (
        <p role="alert" className={styles.submitError}>
          {submitError}
        </p>
      )}
      <button type="submit" className={styles.submit} disabled={isPending}>
        Record outgoing feedstock
      </button>
    </form>
  );
}
