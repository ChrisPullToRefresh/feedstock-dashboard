import { z } from "zod";

import { Direction } from "@/generated/prisma/enums";
import {
  PRODUCER_SINGULAR,
  SEQUESTRATION_SITE_SINGULAR,
} from "@/lib/reference-data";

/**
 * What a movement entry form may contain.
 *
 * This module is imported by the client form, so it must stay free of anything
 * server-only — `specs/2026-08-17-movement-entry/plan.md` § Decisions. That is
 * why the weight rules live here as a zod schema over the entered string rather
 * than in `weight.ts`, which builds a `Prisma.Decimal` and would drag the
 * generated Prisma client into the bundle of the one form that has to load fast
 * in a yard.
 *
 * The division of labor: this schema decides whether a weight is acceptable,
 * the browser runs it for immediate feedback, the Server Action runs it again
 * because a Server Action is a public endpoint, and only then does
 * `parseWeightKg` turn the accepted string into an exact Decimal.
 *
 * `weight.ts` imports the two constants below rather than declaring its own, so
 * the column's precision is stated once.
 */

/** Grams are the smallest unit the `Decimal(12, 3)` column can hold. */
export const WEIGHT_DECIMAL_PLACES = 3;

/**
 * The largest weight the column can hold: twelve digits of precision, three of
 * them after the point, so nine before it. Refused here rather than by
 * Postgres, which would raise a numeric overflow at INSERT — a raw failure at
 * the write, well past the form that could have said something useful.
 */
export const MAX_WEIGHT_KG = "999999999.999";

/**
 * Why an entered weight was refused, in the operator's words.
 *
 * Five separate messages rather than one, so the form never has to match on
 * prose to know which mistake was made. They mirror the `WeightRejection` cases
 * in `weight.ts` one for one; `movement-data.test.ts` and `weight.test.ts` are
 * what keep the two agreeing.
 */
export const WEIGHT_REFUSALS = {
  empty: "Enter a weight in kilograms",
  notANumber: "Enter a weight using digits only, like 1250.5",
  notPositive: "Enter a weight greater than zero",
  tooPrecise: `Enter a weight to ${WEIGHT_DECIMAL_PLACES} decimal places or fewer — a gram is the smallest unit`,
  tooLarge: `Enter a weight of ${MAX_WEIGHT_KG} kg or less`,
} as const;

/**
 * Digits, an optional single decimal point, an optional leading minus. No
 * exponent, no thousands separator, no unit suffix — a phone keypad at a scale
 * produces none of those, and accepting them would mean guessing at intent.
 */
const WEIGHT_PATTERN = /^-?\d+(\.\d+)?$/;

/**
 * How many digits `Decimal(12, 3)` leaves in front of the point.
 *
 * `MAX_WEIGHT_KG` is nine nines followed by three more, so it is the largest
 * value with this many whole digits — which makes "does it fit" a question
 * about digit count alone.
 */
const MAX_WEIGHT_WHOLE_DIGITS = 9;

/**
 * Splits an already-well-formed weight into its sign and its digits.
 *
 * Compared as digits rather than through `Number`: the bound is twelve
 * significant digits, past the point where a float represents its own boundary
 * reliably, and `BigInt` literals are unavailable at this project's ES2017
 * target. Nothing here rounds.
 */
function partsOf(value: string) {
  const negative = value.startsWith("-");
  const digits = negative ? value.slice(1) : value;
  const [whole = "", fraction = ""] = digits.split(".");

  return {
    negative,
    // Leading zeros carry no value and would otherwise inflate the digit count.
    whole: whole.replace(/^0+(?=\d)/, ""),
    fraction,
  };
}

/**
 * An entered weight in kilograms.
 *
 * Trimmed before anything is measured, so " 1250 " and "1250" are the same
 * weight. The checks run in the order a reader would: is there anything, is it
 * a number, is it a number this column can hold, and only then is it a weight
 * worth recording.
 */
export const weightKgSchema = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    const refuse = (message: string) => {
      ctx.addIssue({ code: "custom", message });
    };

    if (value === "") {
      refuse(WEIGHT_REFUSALS.empty);
      return;
    }

    if (!WEIGHT_PATTERN.test(value)) {
      refuse(WEIGHT_REFUSALS.notANumber);
      return;
    }

    // Before the value is measured: 12.3456 is a refusal in its own right, not
    // a weight to be quietly rounded to the gram.
    if ((value.split(".")[1]?.length ?? 0) > WEIGHT_DECIMAL_PLACES) {
      refuse(WEIGHT_REFUSALS.tooPrecise);
      return;
    }

    const { negative, whole, fraction } = partsOf(value);
    const isZero = /^0*$/.test(whole) && /^0*$/.test(fraction);

    // Zero is refused alongside negatives: a movement of nothing is not a
    // movement, and recording one would add a row every total ignores.
    if (negative || isZero) {
      refuse(WEIGHT_REFUSALS.notPositive);
      return;
    }

    if (whole.length > MAX_WEIGHT_WHOLE_DIGITS) {
      refuse(WEIGHT_REFUSALS.tooLarge);
    }
  });

/**
 * The chosen counterparty.
 *
 * Nothing is preselected in the dropdown — `plan.md` § Decisions — so an empty
 * value is the ordinary case of an operator who has not picked yet, and the
 * message says what to do rather than reporting a fault.
 */
export function counterpartyIdSchema(singular: string) {
  return z.string().trim().min(1, `Select a ${singular}`);
}

/** The object form, which is what a form's `FormData` parses into. */
export function movementSchema(singular: string) {
  return z.object({
    weightKg: weightKgSchema,
    counterpartyId: counterpartyIdSchema(singular),
  });
}

/**
 * Which counterparty each direction takes. Inbound comes from a producer,
 * outbound goes to a sequestration site — the check constraint in Phase 2's
 * migration enforces the same pairing in the database.
 */
export const COUNTERPARTY_SINGULAR: Record<Direction, string> = {
  [Direction.INBOUND]: PRODUCER_SINGULAR,
  [Direction.OUTBOUND]: SEQUESTRATION_SITE_SINGULAR,
};

/** A row in a counterparty dropdown. Narrower than the Prisma model on
 * purpose: the form needs a name to show and an id to submit, and nothing a
 * client component renders should carry more of a record than it displays. */
export type CounterpartyOption = { id: string; name: string };

/**
 * What a record action hands back to the form.
 *
 * `success` carries the weight already formatted, because the grouping lives in
 * `formatWeightKg` and that function needs a Decimal — which is exactly what
 * this module keeps off the client.
 *
 * `error` carries both submitted values back. React 19 resets an uncontrolled
 * form once its action settles, so without them every refusal would also wipe
 * what the operator had entered.
 */
export type MovementFormState =
  | { status: "idle" }
  | {
      status: "error";
      message: string;
      /** Which control the message belongs under. */
      field: "weight" | "counterparty";
      submittedWeightKg: string;
      submittedCounterpartyId: string;
    }
  | { status: "success"; weightLabel: string; counterpartyName: string };

export type MovementFormAction = (
  state: MovementFormState,
  formData: FormData,
) => Promise<MovementFormState>;
