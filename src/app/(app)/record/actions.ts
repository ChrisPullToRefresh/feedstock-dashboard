"use server";

import { Direction } from "@/generated/prisma/enums";
import {
  COUNTERPARTY_SINGULAR,
  movementSchema,
  type MovementFormState,
} from "@/lib/movement-data";
import { findActiveCounterparty, recordMovement } from "@/lib/movement-queries";
import { findProducer } from "@/lib/producer-queries";
import { findSite } from "@/lib/site-queries";
import { formatWeightKg, parseWeightKg } from "@/lib/weight";

/**
 * Recording a movement.
 *
 * Each action re-validates with the same schema the form used. A Server Action
 * is a public endpoint — anything that can reach the app can invoke one — so
 * the browser's copy is for fast feedback and this one is what counts.
 *
 * Nothing redirects. `specs/2026-08-17-movement-entry/plan.md` § Decisions
 * keeps the operator on the form: the success state goes back to the client,
 * which announces it and clears the fields for the next weighing. A truck is
 * several weighings, so the next entry is zero taps away.
 */

/** What the browser sent, as a string, whatever it actually sent. */
function submitted(formData: FormData, name: string): string {
  const raw = formData.get(name);

  return typeof raw === "string" ? raw : "";
}

async function record(
  direction: Direction,
  formData: FormData,
): Promise<MovementFormState> {
  const singular = COUNTERPARTY_SINGULAR[direction];
  const submittedWeightKg = submitted(formData, "weightKg");
  const submittedCounterpartyId = submitted(formData, "counterpartyId");

  const parsed = movementSchema(singular).safeParse({
    weightKg: submittedWeightKg,
    counterpartyId: submittedCounterpartyId,
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];

    return {
      status: "error",
      message: issue?.message ?? `Enter a weight and select a ${singular}`,
      // Which control the message belongs under, taken from the path zod
      // reports rather than by matching on the message text.
      field: issue?.path[0] === "counterpartyId" ? "counterparty" : "weight",
      submittedWeightKg,
      submittedCounterpartyId,
    };
  }

  const counterparty = await findActiveCounterparty(
    direction,
    parsed.data.counterpartyId,
  );

  if (counterparty === null) {
    // Only reached when the dropdown has gone stale under the operator, so it
    // is worth a second query to name what happened. An archived row still
    // exists and can be named; an id that was never real cannot.
    const archived =
      direction === Direction.INBOUND
        ? await findProducer(parsed.data.counterpartyId)
        : await findSite(parsed.data.counterpartyId);

    return {
      status: "error",
      message: archived
        ? `${archived.name} has been archived — pick another ${singular}`
        : `That ${singular} is no longer available — pick another`,
      field: "counterparty",
      submittedWeightKg,
      // Cleared, so the refreshed dropdown does not re-offer the row that was
      // just refused.
      submittedCounterpartyId: "",
    };
  }

  const weight = parseWeightKg(parsed.data.weightKg);

  if (!weight.ok) {
    // Unreachable: the schema accepts exactly what parseWeightKg accepts, and
    // `movement-data.test.ts` and `weight.test.ts` hold them to it. Throwing
    // rather than reporting means a future divergence fails loudly instead of
    // becoming a refusal nobody can explain.
    throw new Error(
      `"${parsed.data.weightKg}" passed the movement schema but not parseWeightKg`,
    );
  }

  await recordMovement({
    direction,
    weightKg: weight.weightKg,
    counterpartyId: counterparty.id,
  });

  return {
    status: "success",
    // Formatted here because the grouping lives in `formatWeightKg`, which
    // needs a Decimal — the thing `movement-data.ts` keeps off the client.
    weightLabel: formatWeightKg(weight.weightKg),
    counterpartyName: counterparty.name,
  };
}

export async function recordInboundMovement(
  _previous: MovementFormState,
  formData: FormData,
): Promise<MovementFormState> {
  return record(Direction.INBOUND, formData);
}

export async function recordOutboundMovement(
  _previous: MovementFormState,
  formData: FormData,
): Promise<MovementFormState> {
  return record(Direction.OUTBOUND, formData);
}
