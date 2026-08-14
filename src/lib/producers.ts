import { z } from "zod";

/**
 * What a feedstock producer's name may be, and how to read the list.
 *
 * This module is imported by the client form, so it must stay free of
 * anything server-only — the queries live in `producer-queries.ts` for that
 * reason. The schema is the single one — `plan.md` § Decisions. The browser runs it for
 * immediate feedback and the Server Action runs it again before touching the
 * database, because a Server Action is a public endpoint and the server copy is
 * the one that counts.
 */

/** Keeps the list and Phase 5's dropdown readable on a phone. */
export const PRODUCER_NAME_MAX_LENGTH = 100;

export const producerNameSchema = z
  .string()
  // Trimmed before the length checks, so " Acme " and "Acme" cannot become two
  // rows that look identical on screen and defeat the unique constraint.
  .trim()
  .min(1, "Enter a producer name")
  .max(
    PRODUCER_NAME_MAX_LENGTH,
    `Use ${PRODUCER_NAME_MAX_LENGTH} characters or fewer`,
  );

export const producerSchema = z.object({ name: producerNameSchema });

export type ProducerInput = z.infer<typeof producerSchema>;
