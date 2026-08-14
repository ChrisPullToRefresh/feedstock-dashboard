"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { findProducerByName, producerSchema } from "@/lib/producers";

/**
 * Everything that writes a producer.
 *
 * Each action re-validates with the same schema the form used. A Server Action
 * is a public endpoint — anything that can reach the app can invoke one — so
 * the browser's copy is for fast feedback and this one is what counts.
 * `plan.md` § Decisions.
 */

export type ProducerFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  /**
   * The name belongs to an archived producer. Carries its id so the form can
   * offer to restore it — the only route back to an archived producer, since
   * no screen lists them.
   */
  | { status: "archived-name"; archivedId: string; name: string };

export const IDLE: ProducerFormState = { status: "idle" };

/** Postgres refused the write because a name is already taken. */
function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function parseName(formData: FormData): ProducerFormState | { name: string } {
  const parsed = producerSchema.safeParse({ name: formData.get("name") });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Enter a producer name",
    };
  }

  return { name: parsed.data.name };
}

export async function createProducer(
  _previous: ProducerFormState,
  formData: FormData,
): Promise<ProducerFormState> {
  const parsed = parseName(formData);

  if ("status" in parsed) return parsed;

  const { name } = parsed;
  const existing = await findProducerByName(name);

  if (existing) {
    // Archived is recoverable; active is a genuine duplicate.
    return existing.isActive
      ? { status: "error", message: `${existing.name} is already a producer` }
      : {
          status: "archived-name",
          archivedId: existing.id,
          name: existing.name,
        };
  }

  try {
    await db.producer.create({ data: { name } });
  } catch (error) {
    // The check above races: two requests can both find nothing.
    if (isUniqueViolation(error)) {
      return { status: "error", message: `${name} is already a producer` };
    }
    throw error;
  }

  revalidatePath("/producers");
  redirect("/producers");
}

export async function renameProducer(
  id: string,
  _previous: ProducerFormState,
  formData: FormData,
): Promise<ProducerFormState> {
  const parsed = parseName(formData);

  if ("status" in parsed) return parsed;

  const { name } = parsed;
  const existing = await findProducerByName(name);

  // Renaming to a different case of its own name is a legitimate edit.
  if (existing && existing.id !== id) {
    return existing.isActive
      ? { status: "error", message: `${existing.name} is already a producer` }
      : {
          status: "archived-name",
          archivedId: existing.id,
          name: existing.name,
        };
  }

  try {
    await db.producer.update({ where: { id }, data: { name } });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { status: "error", message: `${name} is already a producer` };
    }
    throw error;
  }

  revalidatePath("/producers");
  redirect("/producers");
}

/**
 * Archiving is the only removal in the app — `specs/mission.md` § Constraints.
 * The row stays, so every movement that references it stays resolvable.
 */
export async function archiveProducer(id: string): Promise<void> {
  await db.producer.update({ where: { id }, data: { isActive: false } });

  revalidatePath("/producers");
  redirect("/producers");
}

export async function restoreProducer(id: string): Promise<void> {
  await db.producer.update({ where: { id }, data: { isActive: true } });

  revalidatePath("/producers");
  redirect("/producers");
}
