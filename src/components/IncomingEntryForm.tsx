"use client";

import { useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import type { Producer } from "@/lib/producers";
import styles from "./EntryForm.module.css";

type FieldErrors = {
  weight?: string;
  producer?: string;
};

export function IncomingEntryForm({
  producers,
  onSubmit,
}: {
  producers: Producer[];
  onSubmit: (input: { weightKg: number; producerId: number }) => Promise<void>;
}) {
  const [weight, setWeight] = useState("");
  const [producerId, setProducerId] = useState("");
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
    if (!producerId) {
      errors.producer = "Producer is required";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitError(null);
    startTransition(async () => {
      try {
        await onSubmit({ weightKg, producerId: Number(producerId) });
      } catch (err) {
        unstable_rethrow(err);
        setSubmitError("Something went wrong — try again");
      }
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
          aria-invalid={fieldErrors.weight ? true : undefined}
          aria-describedby={
            fieldErrors.weight ? "incoming-weight-error" : undefined
          }
        />
        {fieldErrors.weight && (
          <p id="incoming-weight-error" role="alert" className={styles.fieldError}>
            {fieldErrors.weight}
          </p>
        )}
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
          aria-invalid={fieldErrors.producer ? true : undefined}
          aria-describedby={
            fieldErrors.producer ? "incoming-producer-error" : undefined
          }
        >
          <option value="">Select a producer</option>
          {producers.map((producer) => (
            <option key={producer.id} value={producer.id}>
              {producer.name}
            </option>
          ))}
        </select>
        {fieldErrors.producer && (
          <p
            id="incoming-producer-error"
            role="alert"
            className={styles.fieldError}
          >
            {fieldErrors.producer}
          </p>
        )}
      </div>
      {submitError && (
        <p role="alert" className={styles.submitError}>
          {submitError}
        </p>
      )}
      <button type="submit" className={styles.submit} disabled={isPending}>
        Record incoming feedstock
      </button>
    </form>
  );
}
