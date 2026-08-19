import type { Locator, Page } from "@playwright/test";

/**
 * The one on screen, at whichever width this project is.
 *
 * `movement-list.tsx` and `reference-list.tsx` both render the same rows twice
 * — a stacked list for phones and a table for desktop — and hide one with CSS.
 * Both are in the DOM, and `getByText` matches hidden elements, so a bare
 * `.first()` reaches the copy this viewport is not showing.
 *
 * Scoping to the visible one is what lets a single assertion hold in the
 * desktop project and the mobile project alike, which is the point of running
 * the suite twice.
 */
export function visibleText(page: Page, text: string): Locator {
  return page.getByText(text).filter({ visible: true }).first();
}
