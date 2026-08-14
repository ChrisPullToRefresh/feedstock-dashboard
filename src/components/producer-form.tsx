"use client";

import { useActionState, useId, useState } from "react";

import { IDLE, type ProducerFormState } from "@/app/(app)/producers/actions";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PRODUCER_NAME_MAX_LENGTH, producerSchema } from "@/lib/producers";

export type ProducerFormAction = (
  state: ProducerFormState,
  formData: FormData,
) => Promise<ProducerFormState>;

/**
 * The one form behind both creating and renaming a producer.
 *
 * Validation runs twice on purpose — `plan.md` § Decisions. Here it is for
 * immediate feedback, so an obvious mistake never costs a round trip on a
 * phone at the scale; the Server Action runs the same schema again, because
 * that is the copy an attacker cannot skip.
 */
export function ProducerForm({
  action,
  defaultName = "",
  submitLabel,
}: {
  action: ProducerFormAction;
  defaultName?: string;
  submitLabel: string;
}) {
  const [state, dispatch, pending] = useActionState(action, IDLE);
  const [clientError, setClientError] = useState<string | null>(null);
  const nameId = useId();

  /**
   * Synchronous on purpose: `preventDefault` has to run before React hands the
   * submission to the action, and an awaited check would be too late.
   */
  function checkBeforeSubmit(event: React.FormEvent<HTMLFormElement>) {
    const parsed = producerSchema.safeParse({
      name: new FormData(event.currentTarget).get("name"),
    });

    if (parsed.success) {
      setClientError(null);
      return;
    }

    event.preventDefault();
    setClientError(parsed.error.issues[0]?.message ?? "Enter a producer name");
  }

  const message =
    clientError ?? (state.status === "error" ? state.message : null);

  return (
    <form action={dispatch} onSubmit={checkBeforeSubmit} className="space-y-6">
      <Field data-invalid={message ? true : undefined}>
        <FieldLabel htmlFor={nameId}>Name</FieldLabel>
        <Input
          id={nameId}
          name="name"
          defaultValue={defaultName}
          // Long enough to be a real limit, short enough that the browser
          // stops the paste before the schema has to explain it.
          maxLength={PRODUCER_NAME_MAX_LENGTH}
          autoComplete="off"
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? `${nameId}-error` : undefined}
        />
        {message ? (
          <FieldError id={`${nameId}-error`}>{message}</FieldError>
        ) : null}
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
