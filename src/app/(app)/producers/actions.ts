"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { findProducerByName } from "@/lib/producer-queries";
import {
  producerSchema,
  PRODUCER_SINGULAR,
  type ReferenceFormState,
} from "@/lib/reference-data";

/**
 * Everything that writes a producer.
 *
 * Each action re-validates with the same schema the form used. A Server Action
 * is a public endpoint — anything that can reach the app can invoke one — so
 * the browser's copy is for fast feedback and this one is what counts.
 * `specs/2026-08-14-producers/plan.md` § Decisions.
 *
 * The state shape is shared with the sequestration site actions, because the
 * form that reads it is one component —
 * `specs/2026-08-16-sequestration-sites/plan.md` § Decisions.
 */

/**
 * Back to the list, carrying what just happened so the page can say so.
 *
 * Archiving especially needs saying: the row simply disappears, which looks
 * identical to a click that did nothing — `plan.md` § Decisions.
 */
function redirectWithToast(
  event: "created" | "renamed" | "archived" | "restored",
  name: string,
): never {
  redirect(`/producers?${new URLSearchParams({ toast: event, name })}`);
}

/** Postgres refused the write because a name is already taken. */
function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function parseName(formData: FormData): ReferenceFormState | { name: string } {
  const raw = formData.get("name");
  const submitted = typeof raw === "string" ? raw : "";
  const parsed = producerSchema.safeParse({ name: raw });

  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? `Enter a ${PRODUCER_SINGULAR} name`,
      submitted,
    };
  }

  return { name: parsed.data.name };
}

export async function createProducer(
  _previous: ReferenceFormState,
  formData: FormData,
): Promise<ReferenceFormState> {
  const parsed = parseName(formData);

  if ("status" in parsed) return parsed;

  const { name } = parsed;
  const existing = await findProducerByName(name);

  if (existing) {
    // Archived is recoverable; active is a genuine duplicate.
    return existing.isActive
      ? {
          status: "error",
          message: `${existing.name} is already a producer`,
          submitted: name,
        }
      : {
          status: "archived-name",
          archivedId: existing.id,
          name: existing.name,
          submitted: name,
        };
  }

  try {
    await db.producer.create({ data: { name } });
  } catch (error) {
    // The check above races: two requests can both find nothing.
    if (isUniqueViolation(error)) {
      return {
        status: "error",
        message: `${name} is already a producer`,
        submitted: name,
      };
    }
    throw error;
  }

  revalidatePath("/producers");
  redirectWithToast("created", name);
}

export async function renameProducer(
  id: string,
  _previous: ReferenceFormState,
  formData: FormData,
): Promise<ReferenceFormState> {
  const parsed = parseName(formData);

  if ("status" in parsed) return parsed;

  const { name } = parsed;
  const existing = await findProducerByName(name);

  // Renaming to a different case of its own name is a legitimate edit.
  if (existing && existing.id !== id) {
    // No restore offer here. On the create route restoring is what the
    // operator wanted; on a rename it would revive an unrelated producer and
    // silently abandon the rename, then report success for the wrong thing.
    return {
      status: "error",
      message: existing.isActive
        ? `${existing.name} is already a producer`
        : `${existing.name} is archived, so that name is taken`,
      submitted: name,
    };
  }

  try {
    await db.producer.update({ where: { id }, data: { name } });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        status: "error",
        message: `${name} is already a producer`,
        submitted: name,
      };
    }
    throw error;
  }

  revalidatePath("/producers");
  redirectWithToast("renamed", name);
}

/**
 * Archiving is the only removal in the app — `specs/mission.md` § Constraints.
 * The row stays, so every movement that references it stays resolvable.
 */
export async function archiveProducer(id: string): Promise<void> {
  const archived = await db.producer.update({
    where: { id },
    data: { isActive: false },
  });

  revalidatePath("/producers");
  redirectWithToast("archived", archived.name);
}

export async function restoreProducer(id: string): Promise<void> {
  const restored = await db.producer.update({
    where: { id },
    data: { isActive: true },
  });

  revalidatePath("/producers");
  redirectWithToast("restored", restored.name);
}
