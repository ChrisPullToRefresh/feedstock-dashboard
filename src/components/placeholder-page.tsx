/**
 * The shell's destinations are placeholders until Phases 3 to 6 build the
 * pages behind them. This keeps every nav link resolving to something.
 */
export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-2 text-sm">{description}</p>
    </section>
  );
}
