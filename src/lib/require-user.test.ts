import { beforeEach, describe, expect, it, vi } from "vitest";

// Clerk's `auth()` reads a request-scoped session, which no unit test has.
// The stub is what lets both branches be driven directly.
const { auth } = vi.hoisted(() => ({ auth: vi.fn() }));

vi.mock("@clerk/nextjs/server", () => ({ auth }));

const { requireUser } = await import("@/lib/require-user");

beforeEach(() => {
  auth.mockReset();
});

describe("requireUser", () => {
  it("returns the id of a signed-in user", async () => {
    auth.mockResolvedValue({ userId: "user_123" });

    await expect(requireUser()).resolves.toBe("user_123");
  });

  it("throws when there is no session", async () => {
    auth.mockResolvedValue({ userId: null });

    await expect(requireUser()).rejects.toThrow("Not signed in");
  });
});
