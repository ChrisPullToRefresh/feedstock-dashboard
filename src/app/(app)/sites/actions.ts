"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  sequestrationSiteSchema,
  SEQUESTRATION_SITE_SINGULAR,
  type ReferenceFormState,
} from "@/lib/reference-data";
import { findSiteByName } from "@/lib/site-queries";

/**
 * Everything that writes a sequestration site.
 *
 * Each action re-validates with the same schema the form used. A Server Action
 * is a public endpoint — anything that can reach the app can invoke one — so
 * the browser's copy is for fast feedback and this one is what counts.
 *
 * Mirrors `src/app/(app)/producers/actions.ts` rather than sharing a factory
 * with it — `specs/2026-08-16-sequestration-sites/plan.md` § Decisions. The two
 * read very similarly on purpose; the shared schema is what stops the part that
 * would actually diverge, the name rules, from drifting.
 */

/**
 * Back to the list, carrying what just happened so the page can say so.
 *
 * Archiving especially needs saying: the row simply disappears, which looks
 * identical to a click that did nothing.
 */
function redirectWithToast(
  event: "created" | "renamed" | "archived" | "restored",
  name: string,
): never {
  redirect(`/sites?${new URLSearchParams({ toast: event, name })}`);
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
  const parsed = sequestrationSiteSchema.safeParse({ name: raw });

  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ??
        `Enter a ${SEQUESTRATION_SITE_SINGULAR} name`,
      submitted,
    };
  }

  return { name: parsed.data.name };
}

export async function createSite(
  _previous: ReferenceFormState,
  formData: FormData,
): Promise<ReferenceFormState> {
  const parsed = parseName(formData);

  if ("status" in parsed) return parsed;

  const { name } = parsed;
  const existing = await findSiteByName(name);

  if (existing) {
    // Archived is recoverable; active is a genuine duplicate.
    return existing.isActive
      ? {
          status: "error",
          message: `${existing.name} is already a ${SEQUESTRATION_SITE_SINGULAR}`,
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
    await db.sequestrationSite.create({ data: { name } });
  } catch (error) {
    // The check above races: two requests can both find nothing.
    if (isUniqueViolation(error)) {
      return {
        status: "error",
        message: `${name} is already a ${SEQUESTRATION_SITE_SINGULAR}`,
        submitted: name,
      };
    }
    throw error;
  }

  revalidatePath("/sites");
  redirectWithToast("created", name);
}

export async function renameSite(
  id: string,
  _previous: ReferenceFormState,
  formData: FormData,
): Promise<ReferenceFormState> {
  const parsed = parseName(formData);

  if ("status" in parsed) return parsed;

  const { name } = parsed;
  const existing = await findSiteByName(name);

  // Renaming to a different case of its own name is a legitimate edit.
  if (existing && existing.id !== id) {
    // No restore offer here. On the create route restoring is what the
    // operator wanted; on a rename it would revive an unrelated site and
    // silently abandon the rename, then report success for the wrong thing.
    return {
      status: "error",
      message: existing.isActive
        ? `${existing.name} is already a ${SEQUESTRATION_SITE_SINGULAR}`
        : `${existing.name} is archived, so that name is taken`,
      submitted: name,
    };
  }

  try {
    await db.sequestrationSite.update({ where: { id }, data: { name } });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        status: "error",
        message: `${name} is already a ${SEQUESTRATION_SITE_SINGULAR}`,
        submitted: name,
      };
    }
    throw error;
  }

  revalidatePath("/sites");
  redirectWithToast("renamed", name);
}

/**
 * Archiving is the only removal in the app — `specs/mission.md` § Constraints.
 * The row stays, so every movement that references it stays resolvable.
 */
export async function archiveSite(id: string): Promise<void> {
  const archived = await db.sequestrationSite.update({
    where: { id },
    data: { isActive: false },
  });

  revalidatePath("/sites");
  redirectWithToast("archived", archived.name);
}

export async function restoreSite(id: string): Promise<void> {
  const restored = await db.sequestrationSite.update({
    where: { id },
    data: { isActive: true },
  });

  revalidatePath("/sites");
  redirectWithToast("restored", restored.name);
}
