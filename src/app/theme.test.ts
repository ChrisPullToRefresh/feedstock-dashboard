// @vitest-environment node
// Reading a file needs a real `import.meta.url`; under jsdom it is an http: URL.

import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * Phase 0 shipped `emerald-600` as the accent everywhere. It measures 3.67:1 on
 * white and fails WCAG AA for text, and nothing in the suite noticed. These
 * assertions pin the accent to the pair `specs/tech-stack.md` § Application
 * names, in both themes, so retuning it past the threshold fails here first.
 *
 * The ratios themselves stay in the constitution, which carries them measured.
 * This test does not recompute them.
 */
const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

// Tailwind's own oklch values for the shades the constitution names.
const EMERALD_700 = "oklch(50.8% 0.118 165.612)";
const EMERALD_800 = "oklch(43.2% 0.095 166.913)";
const EMERALD_500 = "oklch(69.6% 0.17 162.48)";
const EMERALD_400 = "oklch(76.5% 0.177 163.223)";
const WHITE = "oklch(1 0 0)";
const NEAR_BLACK = "oklch(0.145 0 0)";

// The light-palette field border. An Input and a SelectTrigger are
// `bg-transparent` there, so this is the only thing marking the control —
// WCAG 2.1 SC 1.4.11 puts that at 3:1 and this measures 3.23:1 on
// --background. It equalled --border at 1.26:1 until the fix.
const FIELD_BORDER_LIGHT = "oklch(0.65 0 0)";

/**
 * The declarations of the first `:root` block at or after `anchor`, or the
 * file's first `:root` block when `anchor` is empty.
 *
 * The missing-anchor case throws rather than asserting. `indexOf` treats a
 * negative `fromIndex` as 0, so a vanished anchor would otherwise hand back the
 * light block labelled as the dark one — passing for every token the two
 * themes happen to share. The comment at the top of `globals.css` anticipates
 * a later phase moving back to the `.dark` class form, which is exactly when
 * that would bite.
 */
function rootBlockAfter(anchor: string): Record<string, string> {
  const from = anchor === "" ? 0 : css.indexOf(anchor);
  if (from === -1) {
    throw new Error(`globals.css no longer contains \`${anchor}\``);
  }

  const start = css.indexOf(":root {", from);
  if (start === -1) {
    throw new Error(`globals.css has no :root block after \`${anchor}\``);
  }

  const end = css.indexOf("}", start);
  const block = css.slice(start, end);

  return Object.fromEntries(
    [...block.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [
      name,
      // Prettier wraps a long declaration across lines. Compare the value, not
      // the whitespace it happens to be formatted with.
      value
        .replace(/\s+/g, " ")
        .replace(/\(\s|\s\)/g, (m) => m.trim())
        .trim(),
    ]),
  );
}

// The trailing brace matters: `@custom-variant dark (@media (prefers-color-scheme:
// dark));` mentions the same query higher up the file and is not a rule.
const DARK_BLOCK = "@media (prefers-color-scheme: dark) {";

const light = rootBlockAfter("");
const dark = rootBlockAfter(DARK_BLOCK);

describe("accent tokens", () => {
  it("uses emerald-700 with white on it in light", () => {
    expect(light["--primary"]).toBe(EMERALD_700);
    expect(light["--sidebar-primary"]).toBe(EMERALD_700);
    expect(light["--primary-foreground"]).toBe(WHITE);
    expect(light["--sidebar-primary-foreground"]).toBe(WHITE);
  });

  it("uses emerald-500 with near-black on it in dark", () => {
    expect(dark["--primary"]).toBe(EMERALD_500);
    expect(dark["--sidebar-primary"]).toBe(EMERALD_500);
    expect(dark["--primary-foreground"]).toBe(NEAR_BLACK);
    expect(dark["--sidebar-primary-foreground"]).toBe(NEAR_BLACK);
  });

  it("moves the hover fill away from the background, not toward it", () => {
    // An alpha fill washes toward the background and loses contrast under the
    // label: `bg-primary/80` on white measured 3.72:1, below AA. The hover
    // shade darkens in light and lightens in dark instead.
    expect(light["--primary-hover"]).toBe(EMERALD_800);
    expect(dark["--primary-hover"]).toBe(EMERALD_400);
  });

  it("keeps emerald-600 out of every text role", () => {
    // `specs/tech-stack.md` § Application reserves it for non-text roles —
    // focus rings and borders — where the bar is 3:1 rather than 4.5:1. Those
    // are exempt here; anything that can end up under text is not.
    const nonText = (token: string) =>
      token === "--accent-emerald" ||
      token.endsWith("-ring") ||
      token.endsWith("-border") ||
      token === "--input";

    for (const theme of [light, dark]) {
      for (const [token, value] of Object.entries(theme)) {
        if (nonText(token)) continue;

        expect(value, `${token} must not carry the accent`).not.toContain(
          "--accent-emerald",
        );
      }
    }
  });
});

describe("the field border", () => {
  it("clears 3:1 against the light background", () => {
    // Pinned by value: the ratio is in `specs/tech-stack.md` § Application,
    // which carries it measured, and this test does not recompute it. What it
    // stops is the token drifting back to --border, which is where it started
    // and which measures 1.26:1.
    expect(light["--input"]).toBe(FIELD_BORDER_LIGHT);
  });

  it("is darker than the decorative border it used to equal", () => {
    // --border rules table rows and separators, which carry no information SC
    // 1.4.11 covers, so it is deliberately left alone. If a later change makes
    // them equal again, the field boundary has silently gone back to 1.26:1.
    expect(light["--input"]).not.toBe(light["--border"]);
  });

  it("leaves the dark palette alone, which already passed at 3.82:1", () => {
    expect(dark["--input"]).toBe("oklch(1 0 0 / 15%)");
  });
});
