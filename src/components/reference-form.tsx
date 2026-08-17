"use client";

import { useActionState, useId, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  REFERENCE_NAME_MAX_LENGTH,
  referenceSchema,
  type ReferenceFormAction,
  type ReferenceFormState,
} from "@/lib/reference-data";

/**
 * Defined here rather than exported from an actions module: a "use server"
 * file may only export async functions, so a shared constant object there
 * fails the build.
 */
const IDLE: ReferenceFormState = { status: "idle" };

/**
 * The one form behind creating and renaming both producers and sequestration
 * sites.
 *
 * Generalized in Phase 4 rather than copied —
 * `specs/2026-08-16-sequestration-sites/plan.md` § Decisions. It takes
 * individual props rather than a per-entity config object, so the words stay
 * next to the screen they appear on and TypeScript catches a missing one.
 *
 * Validation runs twice on purpose. Here it is for immediate feedback, so an
 * obvious mistake never costs a round trip on a phone at the scale; the Server
 * Action runs the same schema again, because that is the copy an attacker
 * cannot skip.
 */
export function ReferenceForm({
  singular,
  action,
  restore,
  defaultName = "",
  submitLabel,
}: {
  /** What a refusal calls the thing — "producer", "sequestration site". */
  singular: string;
  action: ReferenceFormAction;
  /**
   * Brings an archived row back. The form only ever offers this when the
   * action reports the name belongs to one — which is the only route to an
   * archived row, since no screen lists them.
   */
  restore: (id: string) => Promise<void>;
  defaultName?: string;
  submitLabel: string;
}) {
  const [state, dispatch, pending] = useActionState(action, IDLE);
  const [clientError, setClientError] = useState<string | null>(null);
  const [name, setName] = useState(defaultName);
  const nameId = useId();

  // The schema carries the entity's words in its messages, so it is built from
  // the label rather than passed in beside it — one prop that cannot disagree
  // with itself.
  const schema = useMemo(() => referenceSchema(singular), [singular]);

  // React 19 resets an uncontrolled form once its action settles, which on
  // every refusal wiped what the operator had typed — on the edit route it
  // even reverted to the old name, so the error pointed at a value no longer
  // on screen. The field is controlled, and the actions echo back what they
  // were given, so a refusal leaves the text where it was.
  //
  // Adjusted during render rather than in an effect: React's documented way to
  // react to a changed value, and it avoids the extra paint an effect costs.
  const [lastState, setLastState] = useState(state);

  if (state !== lastState) {
    setLastState(state);

    if (state.status === "error" || state.status === "archived-name") {
      setName(state.submitted);
    }
  }

  /**
   * Synchronous on purpose: `preventDefault` has to run before React hands the
   * submission to the action, and an awaited check would be too late.
   */
  function checkBeforeSubmit(event: React.FormEvent<HTMLFormElement>) {
    const parsed = schema.safeParse({
      name: new FormData(event.currentTarget).get("name"),
    });

    if (parsed.success) {
      setClientError(null);
      return;
    }

    event.preventDefault();
    setClientError(
      parsed.error.issues[0]?.message ?? `Enter a ${singular} name`,
    );
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
            value={name}
            onChange={(event) => setName(event.target.value)}
            // Long enough to be a real limit, short enough that the browser
            // stops the paste before the schema has to explain it.
            maxLength={REFERENCE_NAME_MAX_LENGTH}
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
      {state.status === "archived-name" && clientError === null ? (
        <div role="alert" className="rounded-md border p-4 text-sm">
          <p>
            <span className="font-medium">{state.name}</span> is archived. That
            name is still taken, so it cannot be used for a new {singular} —
            restoring brings the original back with its movement history
            attached.
          </p>
          {/* Bound in the browser, so the id is client-supplied — unlike the
              rename action, which is bound on the server. Acceptable only
              because specs/tech-stack.md § Auth gives every authenticated user
              the same reference-data rights, so this grants nothing new. */}
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
