import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import Link from "next/link";

/**
 * The chooser: which way is the feedstock moving?
 *
 * Direction lives in the URL rather than in a toggle on one page —
 * `specs/2026-08-17-movement-entry/plan.md` § Decisions. That is what lets a
 * save keep the operator on a page that already knows which form it is, and it
 * gives Phase 7 two addresses to link straight into.
 *
 * The words are the yard's, not the enum's: "Feedstock in" and "Feedstock out"
 * on screen, `inbound` and `outbound` in the path. The same trade Phase 4 made
 * when it kept `/sites` while writing "sequestration site" on the screen.
 */
const DESTINATIONS = [
  {
    href: "/record/inbound",
    label: "Feedstock in",
    description: "Material arriving from a producer",
    icon: ArrowDownToLine,
  },
  {
    href: "/record/outbound",
    label: "Feedstock out",
    description: "Material leaving for a sequestration site",
    icon: ArrowUpFromLine,
  },
];

export default function RecordPage() {
  return (
    <section className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Record</h1>
      {/* Two targets, stacked and full width, so either is reachable with one
          thumb at the scale — specs/mission.md § Constraints. */}
      <div className="grid gap-4">
        {DESTINATIONS.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 rounded-lg border p-6 transition-colors hover:bg-accent focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <Icon className="size-6 shrink-0 text-primary" aria-hidden />
            <span>
              <span className="block text-lg font-medium">{label}</span>
              <span className="block text-sm text-muted-foreground">
                {description}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
