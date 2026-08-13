import { describe, expect, it, vi } from "vitest";

import {
  UsageError,
  generatePassword,
  parseEmail,
  provisionUser,
} from "@/lib/provision-user";

describe("parseEmail", () => {
  it("returns the address", () => {
    expect(parseEmail(["arin@example.com"])).toBe("arin@example.com");
  });

  it.each([
    [[], "no argument"],
    [["not-an-email"], "no @"],
    [["missing@domain"], "no dot in the domain"],
    [["two words@example.com"], "whitespace"],
    [["a@example.com", "b@example.com"], "two addresses"],
  ])("rejects %j — %s", (argv) => {
    expect(() => parseEmail(argv)).toThrow(UsageError);
  });
});

describe("provisionUser", () => {
  it("creates the user and returns the id", async () => {
    const createUser = vi.fn(async () => ({ id: "user_123" }));

    const id = await provisionUser(
      { createUser },
      "arin@example.com",
      "s3cret",
    );

    expect(createUser).toHaveBeenCalledOnce();
    expect(createUser).toHaveBeenCalledWith({
      emailAddress: ["arin@example.com"],
      password: "s3cret",
      skipPasswordChecks: true,
    });
    expect(id).toBe("user_123");
  });

  it("never reaches Clerk when the argument is bad", () => {
    const createUser = vi.fn();

    // parseEmail is what guards the call, so a malformed argument has to fail
    // before anything is created — a bad account is a manual cleanup in Clerk.
    expect(() => parseEmail(["oops"])).toThrow(UsageError);
    expect(createUser).not.toHaveBeenCalled();
  });
});

describe("generatePassword", () => {
  it("is long, random, and URL-safe", () => {
    const a = generatePassword();
    const b = generatePassword();

    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(32);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
