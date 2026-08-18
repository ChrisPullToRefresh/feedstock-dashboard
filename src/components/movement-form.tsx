"use client";

import { useActionState, useId, useMemo, useState } from "react";

import type { Direction } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  COUNTERPARTY_SINGULAR,
  movementSchema,
  type CounterpartyOption,
  type MovementFormAction,
  type MovementFormState,
} from "@/lib/movement-data";

/**
 * Defined here rather than exported from an actions module: a "use server"
 * file may only export async functions, so a shared constant object there
 * fails the build.
 */
const IDLE: MovementFormState = { status: "idle" };

/** "sequestration site" reads as "Sequestration site" above its control. */
function asLabel(singular: string): string {
  return singular.charAt(0).toUpperCase() + singular.slice(1);
}

/**
 * The one form behind recording feedstock in and feedstock out.
 *
 * The two directions differ in the direction they write, the word above the
 * dropdown and which table the options come from — everything else is written
 * once, per `specs/2026-08-17-movement-entry/plan.md` § Decisions. `direction`
 * is the single prop the words derive from, so the label and the placeholder
 * cannot disagree with the action being called.
 *
 * Validation runs twice on purpose. Here it is for immediate feedback, so an
 * obvious mistake never costs a round trip on a phone at the scale; the Server
 * Action runs the same schema again, because that is the copy an attacker
 * cannot skip.
 */
export function MovementForm({
  direction,
  options,
  action,
  submitLabel,
}: {
  direction: Direction;
  /** Active counterparties only. The route decides that; this renders them. */
  options: readonly CounterpartyOption[];
  action: MovementFormAction;
  submitLabel: string;
}) {
  const [state, dispatch, pending] = useActionState(action, IDLE);
  const [clientError, setClientError] = useState<{
    message: string;
    field: "weight" | "counterparty";
  } | null>(null);
  const [weightKg, setWeightKg] = useState("");
  const [counterpartyId, setCounterpartyId] = useState("");
  const weightFieldId = useId();
  const counterpartyFieldId = useId();

  const singular = COUNTERPARTY_SINGULAR[direction];
  const schema = useMemo(() => movementSchema(singular), [singular]);

  // React 19 resets an uncontrolled form once its action settles. Both fields
  // are controlled and the action echoes back what it was given, so a refusal
  // leaves the entry where it was and a success clears it deliberately rather
  // than as a side effect.
  //
  // Adjusted during render rather than in an effect: React's documented way to
  // react to a changed value, and it avoids the extra paint an effect costs.
  const [lastState, setLastState] = useState(state);

  if (state !== lastState) {
    setLastState(state);

    if (state.status === "error") {
      setWeightKg(state.submittedWeightKg);
      setCounterpartyId(state.submittedCounterpartyId);
    }

    if (state.status === "success") {
      setWeightKg("");
      setCounterpartyId("");
    }
  }

  /**
   * Synchronous on purpose: `preventDefault` has to run before React hands the
   * submission to the action, and an awaited check would be too late.
   */
  function checkBeforeSubmit(event: React.FormEvent<HTMLFormElement>) {
    const entered = new FormData(event.currentTarget);
    const parsed = schema.safeParse({
      weightKg: entered.get("weightKg"),
      counterpartyId: entered.get("counterpartyId"),
    });

    if (parsed.success) {
      setClientError(null);
      return;
    }

    event.preventDefault();

    const issue = parsed.error.issues[0];

    setClientError({
      message: issue?.message ?? `Enter a weight and select a ${singular}`,
      // Taken from the path zod reports, never by matching on the message.
      field: issue?.path[0] === "counterpartyId" ? "counterparty" : "weight",
    });
  }

  const failure =
    clientError ??
    (state.status === "error"
      ? { message: state.message, field: state.field }
      : null);
  const weightError = failure?.field === "weight" ? failure.message : null;
  const counterpartyError =
    failure?.field === "counterparty" ? failure.message : null;

  return (
    <form action={dispatch} onSubmit={checkBeforeSubmit} className="space-y-6">
      <Field data-invalid={weightError ? true : undefined}>
        <FieldLabel htmlFor={weightFieldId}>Weight (kg)</FieldLabel>
        {/* Text with a decimal input mode, not type="number":
            specs/2026-08-17-movement-entry/plan.md § Decisions. It raises the
            decimal keypad on a phone without the spinners, and without an
            arrow key or a scroll wheel being able to change a weight on its
            way to an append-only table. */}
        <Input
          id={weightFieldId}
          name="weightKg"
          type="text"
          inputMode="decimal"
          value={weightKg}
          onChange={(event) => setWeightKg(event.target.value)}
          autoComplete="off"
          aria-invalid={weightError ? true : undefined}
          aria-describedby={weightError ? `${weightFieldId}-error` : undefined}
        />
        {weightError ? (
          <FieldError id={`${weightFieldId}-error`}>{weightError}</FieldError>
        ) : null}
      </Field>

      <Field data-invalid={counterpartyError ? true : undefined}>
        <FieldLabel htmlFor={counterpartyFieldId}>
          {asLabel(singular)}
        </FieldLabel>
        {/* Nothing preselected — plan.md § Decisions. A movement can never be
            recorded against a counterparty nobody chose. */}
        <Select
          name="counterpartyId"
          value={counterpartyId}
          onValueChange={setCounterpartyId}
        >
          <SelectTrigger
            id={counterpartyFieldId}
            className="w-full"
            aria-invalid={counterpartyError ? true : undefined}
            aria-describedby={
              counterpartyError ? `${counterpartyFieldId}-error` : undefined
            }
          >
            <SelectValue placeholder={`Select a ${singular}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {counterpartyError ? (
          <FieldError id={`${counterpartyFieldId}-error`}>
            {counterpartyError}
          </FieldError>
        ) : null}
      </Field>

      {/* Disabled while the write is in flight, which is what stops a
          double-tap at the scale writing two rows that nothing can undo. */}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
