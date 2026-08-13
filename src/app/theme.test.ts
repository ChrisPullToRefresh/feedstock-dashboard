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
const EMERALD_500 = "oklch(69.6% 0.17 162.48)";
const WHITE = "oklch(1 0 0)";
const NEAR_BLACK = "oklch(0.145 0 0)";

/** The declarations of the first `:root` block at or after `from`. */
function rootBlockAfter(from: number): Record<string, string> {
  const start = css.indexOf(":root {", from);
  expect(start, "no :root block found").toBeGreaterThan(-1);

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

const light = rootBlockAfter(0);
const dark = rootBlockAfter(css.indexOf(DARK_BLOCK));

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

  it("keeps emerald-600 out of every text role", () => {
    // The constitution reserves it for focus rings and borders, where the bar
    // is 3:1 rather than 4.5:1.
    for (const theme of [light, dark]) {
      for (const [token, value] of Object.entries(theme)) {
        if (token.endsWith("-ring") || token === "--accent-emerald") continue;

        expect(value, `${token} must not carry the accent`).not.toContain(
          "--accent-emerald",
        );
      }
    }
  });
});
