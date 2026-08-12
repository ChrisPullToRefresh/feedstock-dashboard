import {
  ArrowLeftRight,
  CirclePlus,
  Factory,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

export type NavDestination = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/**
 * The shell's destinations. The pages behind them are placeholders until
 * Phases 3 and 4 fill them in. One list feeds both the mobile tab bar and
 * the desktop sidebar, because they are the same nav at two widths.
 */
export const NAV_DESTINATIONS: readonly NavDestination[] = [
  { href: "/", label: "Movements", icon: ArrowLeftRight },
  { href: "/record", label: "Record", icon: CirclePlus },
  { href: "/producers", label: "Producers", icon: Factory },
  { href: "/sites", label: "Sites", icon: Warehouse },
];

export function isActiveDestination(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";

  // Match on a path boundary: a bare startsWith would light up /record for
  // /records, and two links claiming aria-current fails silently.
  return pathname === href || pathname.startsWith(`${href}/`);
}
