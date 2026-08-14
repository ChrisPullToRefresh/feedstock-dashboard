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
 * Archiving, behind a confirmation.
 *
 * Nothing else in v0.1 removes anything, and archived producers appear on no
 * screen afterwards — `plan.md` § Decisions — so from inside the app this is
 * effectively irreversible. That is when a confirm step earns its place.
 *
 * The dialog names the producer, because "are you sure?" on the wrong row is
 * how the wrong row gets archived.
 */
export function ArchiveProducerDialog({
  producerName,
  archive,
}: {
  producerName: string;
  /** A Server Action already bound to the producer's id. */
  archive: () => Promise<void>;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Archive</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive {producerName}?</AlertDialogTitle>
          <AlertDialogDescription>
            It stops appearing in the producers list and in the inbound movement
            dropdown. Its record and its movement history stay intact, and
            nothing is deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form action={archive}>
            {/* Named for what it does, not "Continue" — the label is the last
                thing read before the producer disappears. */}
            <AlertDialogAction type="submit">
              Archive producer
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
