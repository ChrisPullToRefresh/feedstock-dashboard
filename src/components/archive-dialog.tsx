"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/**
 * Archiving a piece of reference data, behind a confirmation.
 *
 * Nothing else in v0.1 removes anything, and archived rows appear on no screen
 * afterwards — `plan.md` § Decisions — so from inside the app this is
 * effectively irreversible. That is when a confirm step earns its place.
 *
 * The dialog names the row, because "are you sure?" on the wrong row is how
 * the wrong row gets archived.
 *
 * Shared by producers and sequestration sites as of Phase 4: the description
 * and the confirm label come from the caller, because which dropdown a row
 * leaves is the one thing that genuinely differs between them.
 */
export function ArchiveDialog({
  name,
  description,
  confirmLabel,
  archive,
}: {
  name: string;
  /** What archiving does, in this entity's terms. */
  description: string;
  /** Named for what it does, not "Continue" — see below. */
  confirmLabel: string;
  /** A Server Action already bound to the row's id. */
  archive: () => Promise<void>;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Archive</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive {name}?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form action={archive}>
            {/* The label is the last thing read before the row disappears, so
                it says what is about to happen rather than "Continue". */}
            <AlertDialogAction type="submit">{confirmLabel}</AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
