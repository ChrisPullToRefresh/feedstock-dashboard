"use client";

/**
 * The last boundary. `src/app/(app)/error.tsx` catches errors inside the shell;
 * this one catches what that cannot — the root layout itself, and routes outside
 * the `(app)` group, chiefly `/sign-in`. Without it, a visitor who already
 * cannot get in sees Next's bare fallback.
 *
 * Next replaces the root layout with this component, so it has to supply its own
 * `<html>` and `<body>`: no Inter, no theme tokens, no shell. The styling is
 * therefore inline and deliberately plain — it must render when the layout that
 * normally provides everything is the thing that broke.
 *
 * As in the shell's boundary, `error.message` is never rendered — it can carry
 * server detail — and `digest` is the handle that ties this to the server log.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          fontFamily: "system-ui, sans-serif",
          color: "#0a0a0a",
          background: "#ffffff",
        }}
      >
        <main style={{ maxWidth: "32rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>
            Something went wrong
          </h1>
          <p style={{ marginTop: "0.5rem", color: "#525252" }}>
            The page could not be loaded. Nothing you entered has been recorded.
          </p>
          {error.digest ? (
            <p
              style={{
                marginTop: "0.5rem",
                fontFamily: "ui-monospace, monospace",
                fontSize: "0.75rem",
                color: "#525252",
              }}
            >
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.5rem 1rem",
              borderRadius: "0.625rem",
              border: 0,
              background: "#007956",
              color: "#ffffff",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
