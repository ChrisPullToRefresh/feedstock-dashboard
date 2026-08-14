import { Prisma } from "@/generated/prisma/client";

/**
 * Weights in kilograms, held exactly.
 *
 * `specs/mission.md` § Constraints makes the kilogram the only unit, and
 * `plan.md` § Decisions makes the column `Decimal(12, 3)` — exact to the gram,
 * because Phase 6's running totals are precisely where binary floats drift.
 * Nothing here touches a database, so Phase 5's forms and Phase 6's totals
 * both build on arithmetic that is tested on its own.
 */

/** Grams are the smallest unit the column can hold. */
export const WEIGHT_DECIMAL_PLACES = 3;

/**
 * Why an entered weight was refused. Separate cases rather than one message,
 * so Phase 5's form can say something specific about each without matching on
 * prose.
 */
export type WeightRejection =
  "empty" | "not-a-number" | "not-positive" | "too-precise";

export type ParsedWeight =
  | { ok: true; weightKg: Prisma.Decimal }
  | { ok: false; reason: WeightRejection };

/**
 * Turns what an operator typed into an exact weight, or says why it cannot.
 *
 * Deliberately strict about the shape: digits, an optional single decimal
 * point, and an optional leading minus. No exponent, no thousands separator,
 * no unit suffix — a phone keypad at a scale produces none of those, and
 * accepting them would mean guessing at intent.
 */
export function parseWeightKg(input: string): ParsedWeight {
  const trimmed = input.trim();

  if (trimmed === "") {
    return { ok: false, reason: "empty" };
  }

  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return { ok: false, reason: "not-a-number" };
  }

  // Checked before constructing the Decimal, which would silently round.
  const enteredPlaces = trimmed.split(".")[1]?.length ?? 0;

  if (enteredPlaces > WEIGHT_DECIMAL_PLACES) {
    return { ok: false, reason: "too-precise" };
  }

  const weightKg = new Prisma.Decimal(trimmed);

  // Zero is refused alongside negatives: a movement of nothing is not a
  // movement, and recording one would add a row that every total ignores.
  if (weightKg.lessThanOrEqualTo(0)) {
    return { ok: false, reason: "not-positive" };
  }

  return { ok: true, weightKg };
}

/**
 * Renders a stored weight the way an operator reads it — grouped thousands,
 * and only the decimal places that carry information, so 1250.500 shows as
 * "1,250.5" rather than padding every whole weight with zeros.
 *
 * Formats from the Decimal's own digits rather than converting to a number,
 * so nothing rounds on the way to the screen.
 */
export function formatWeightKg(weightKg: Prisma.Decimal): string {
  const [whole, fraction = ""] = weightKg
    .toFixed(WEIGHT_DECIMAL_PLACES)
    .split(".");

  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const significant = fraction.replace(/0+$/, "");

  return significant === "" ? grouped : `${grouped}.${significant}`;
}
