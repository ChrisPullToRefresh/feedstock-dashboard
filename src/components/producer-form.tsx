"use client";

import { useActionState, useId, useState } from "react";

import type { ProducerFormState } from "@/app/(app)/producers/actions";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PRODUCER_NAME_MAX_LENGTH, producerSchema } from "@/lib/producers";

/**
 * Defined here rather than exported from the actions module: a "use server"
 * file may only export async functions, so a shared constant object there
 * fails the build.
 */
const IDLE: ProducerFormState = { status: "idle" };

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
  restore,
  defaultName = "",
  submitLabel,
}: {
  action: ProducerFormAction;
  /**
   * Brings an archived producer back. The form only ever offers this when the
   * action reports the name belongs to one — which is the only route to an
   * archived producer, since no screen lists them.
   */
  restore: (id: string) => Promise<void>;
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
    <div className="space-y-6">
      <form
        action={dispatch}
        onSubmit={checkBeforeSubmit}
        className="space-y-6"
      >
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

      {/* Deliberately a sibling of the form, not a child: a nested <form> is
          invalid HTML, and the browser drops it — the Restore button would
          then submit the form it was sitting inside. */}
      {state.status === "archived-name" ? (
        <div role="alert" className="rounded-md border p-4 text-sm">
          <p>
            <span className="font-medium">{state.name}</span> is archived. That
            name is still taken, so it cannot be used for a new producer —
            restoring brings the original back with its movement history
            attached.
          </p>
          <form action={restore.bind(null, state.archivedId)} className="mt-3">
            <Button type="submit" variant="outline">
              Restore {state.name}
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
