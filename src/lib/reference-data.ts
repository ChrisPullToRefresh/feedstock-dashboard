import { z } from "zod";

/**
 * What a piece of reference data may be called.
 *
 * Producers and sequestration sites carry a name and an `isActive` flag and
 * nothing else, so one set of name rules governs both —
 * `specs/2026-08-16-sequestration-sites/plan.md` § Decisions. Separate bounds
 * per entity were offered and declined: there would be two numbers to justify,
 * and the dropdown-readability argument applies equally to both.
 *
 * This module is imported by the client forms, so it must stay free of
 * anything server-only — the queries live in `producer-queries.ts` and
 * `site-queries.ts` for that reason. The browser runs these schemas for
 * immediate feedback and the Server Actions run them again before touching the
 * database, because a Server Action is a public endpoint and the server copy is
 * the one that counts.
 */

/** Keeps the lists and Phase 5's dropdowns readable on a phone. */
export const REFERENCE_NAME_MAX_LENGTH = 100;

/**
 * The rules are shared; the words are not. `singular` is what the message
 * calls the thing — "producer", "sequestration site" — so a refusal names what
 * the operator was actually creating.
 */
export function referenceNameSchema(singular: string) {
  return (
    z
      .string()
      // Trimmed before the length checks, so " Acme " and "Acme" cannot become
      // two rows that look identical on screen and defeat the unique
      // constraint.
      .trim()
      .min(1, `Enter a ${singular} name`)
      .max(
        REFERENCE_NAME_MAX_LENGTH,
        `Use ${REFERENCE_NAME_MAX_LENGTH} characters or fewer`,
      )
  );
}

/** The object form, which is what a form's `FormData` parses into. */
export function referenceSchema(singular: string) {
  return z.object({ name: referenceNameSchema(singular) });
}

export const PRODUCER_SINGULAR = "producer";
export const SEQUESTRATION_SITE_SINGULAR = "sequestration site";

export const producerNameSchema = referenceNameSchema(PRODUCER_SINGULAR);
export const producerSchema = referenceSchema(PRODUCER_SINGULAR);

export const sequestrationSiteNameSchema = referenceNameSchema(
  SEQUESTRATION_SITE_SINGULAR,
);
export const sequestrationSiteSchema = referenceSchema(
  SEQUESTRATION_SITE_SINGULAR,
);

export type ReferenceInput = z.infer<ReturnType<typeof referenceSchema>>;

/**
 * What a create or rename action hands back to the form.
 *
 * Shared rather than declared per entity: the form is one component, so the
 * two actions modules have to agree on this shape for it to be generic at all.
 */
export type ReferenceFormState =
  | { status: "idle" }
  /**
   * `submitted` carries the name back to the form. React 19 resets an
   * uncontrolled form once its action settles, so without it every refusal
   * would also wipe what the operator typed.
   */
  | { status: "error"; message: string; submitted: string }
  /**
   * The name belongs to an archived row. Carries its id so the form can offer
   * to restore it — the only route back to an archived row, since no screen
   * lists them.
   */
  | {
      status: "archived-name";
      archivedId: string;
      name: string;
      submitted: string;
    };

export type ReferenceFormAction = (
  state: ReferenceFormState,
  formData: FormData,
) => Promise<ReferenceFormState>;
