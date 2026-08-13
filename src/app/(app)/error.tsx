"use client";

import { Button } from "@/components/ui/button";

/**
 * Without this boundary a thrown error unmounts the root layout with it, so
 * the shell's navigation goes too and an operator at the scale is left on a
 * bare error page with only the URL bar to get back. Living under the root
 * layout, it replaces the page and keeps the shell.
 *
 * The error's own message is deliberately not rendered — it can carry server
 * detail. `digest` is the handle that ties this render to the server log.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">
        The page could not be loaded. Nothing you entered has been recorded.
      </p>
      {error.digest ? (
        <p className="text-muted-foreground mt-2 font-mono text-xs">
          Reference: {error.digest}
        </p>
      ) : null}
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </section>
  );
}
