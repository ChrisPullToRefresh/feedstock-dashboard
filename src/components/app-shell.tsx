"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { NAV_DESTINATIONS, isActiveDestination } from "@/lib/navigation";

/**
 * One navigation, two widths. On a phone it is a fixed bottom tab bar, in
 * the thumb zone; from `md` up the same element becomes a persistent left
 * sidebar. Rendering it once — rather than as a hidden mobile copy and a
 * hidden desktop copy — keeps a single accessible name per destination.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-full flex-col md:pl-60">
      {/*
       * The nav precedes main in the DOM, which is right for the desktop
       * sidebar but puts the mobile tab bar — rendered at the bottom of the
       * screen — ahead of the content in focus order. One nav element cannot
       * be in two places, so a skip link is the remedy.
       */}
      <a
        href="#main-content"
        className="focus:bg-background focus:ring-ring sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-60 focus:rounded-lg focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:ring-3"
      >
        Skip to content
      </a>

      <nav
        aria-label="Main"
        className={cn(
          // Mobile: fixed tab bar across the bottom, clear of the home indicator.
          "bg-background fixed inset-x-0 bottom-0 z-50 border-t pb-[env(safe-area-inset-bottom)]",
          // Desktop: the same nav, widened into a persistent left sidebar.
          "md:inset-y-0 md:right-auto md:w-60 md:flex-col md:border-t-0 md:border-r md:pb-0",
        )}
      >
        <p className="text-muted-foreground hidden px-6 py-6 text-sm font-semibold tracking-wide uppercase md:block">
          Feedstock
        </p>

        <ul className="flex items-stretch md:flex-col md:gap-1 md:px-3">
          {NAV_DESTINATIONS.map(({ href, label, icon: Icon }) => {
            const active = isActiveDestination(pathname, href);

            return (
              <li key={href} className="flex-1 md:flex-none">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium",
                    "md:h-auto md:flex-row md:justify-start md:gap-3 md:rounded-lg md:px-3 md:py-2 md:text-sm",
                    "focus-visible:ring-ring focus-visible:ring-3 focus-visible:outline-none",
                    // The weight, not the color, is what marks the current
                    // destination. text-primary against text-muted-foreground
                    // differs by 1.13:1 in relative luminance, so hue alone
                    // leaves a colorblind operator unable to tell which tab is
                    // current — WCAG 2.2 SC 1.4.1.
                    active
                      ? "text-primary md:bg-muted font-semibold"
                      : "text-muted-foreground hover:text-foreground md:hover:bg-muted",
                  )}
                >
                  <Icon aria-hidden="true" className="size-5 md:size-4" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/*
       * Bottom padding derives from the bar's own height and inset rather
       * than a hand-synced constant, so content never sits behind it.
       */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 px-6 py-8 pb-[calc(4rem+env(safe-area-inset-bottom)+2rem)] md:px-10 md:pb-8"
      >
        {children}
      </main>
    </div>
  );
}
