import { describe, expect, it } from "vitest";

import { isActiveDestination } from "@/lib/navigation";

describe("isActiveDestination", () => {
  it("matches a destination exactly", () => {
    expect(isActiveDestination("/record", "/record")).toBe(true);
  });

  it("matches a nested path under a destination", () => {
    expect(isActiveDestination("/producers/42/edit", "/producers")).toBe(true);
  });

  it("does not match a sibling route that merely shares a prefix", () => {
    expect(isActiveDestination("/records", "/record")).toBe(false);
    expect(isActiveDestination("/sites-map", "/sites")).toBe(false);
  });

  it("matches the root destination only at the root", () => {
    expect(isActiveDestination("/", "/")).toBe(true);
    expect(isActiveDestination("/producers", "/")).toBe(false);
  });
});
