"use client";

import { useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";

export function SequestrationSiteForm({
  onCreate,
}: {
  onCreate: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setFieldError("Name is required");
      return;
    }
    setFieldError(null);
    setSubmitError(null);
    startTransition(async () => {
      try {
        await onCreate(trimmed);
      } catch (err) {
        unstable_rethrow(err);
        setSubmitError("Something went wrong — try again");
      }
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
        aria-invalid={fieldError ? true : undefined}
        aria-describedby={fieldError ? "site-name-error" : undefined}
      />
      {fieldError && (
        <p id="site-name-error" role="alert">
          {fieldError}
        </p>
      )}
      {submitError && <p role="alert">{submitError}</p>}
      <button type="submit" disabled={isPending}>
        Create site
      </button>
    </form>
  );
}
