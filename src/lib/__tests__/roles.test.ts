import { beforeEach, describe, expect, it, vi } from "vitest";

const headersMock = vi.fn();
vi.mock("next/headers", () => ({ headers: headersMock }));

describe("getUserRole", () => {
  beforeEach(() => {
    vi.resetModules();
    headersMock.mockReset();
  });

  it("returns 'admin' when the x-user-role header is 'admin'", async () => {
    headersMock.mockResolvedValue(new Headers({ "x-user-role": "admin" }));
    const { getUserRole } = await import("../roles");

    await expect(getUserRole()).resolves.toBe("admin");
  });

  it("returns 'operator' when the x-user-role header is 'operator'", async () => {
    headersMock.mockResolvedValue(new Headers({ "x-user-role": "operator" }));
    const { getUserRole } = await import("../roles");

    await expect(getUserRole()).resolves.toBe("operator");
  });

  it("returns undefined when the header is missing", async () => {
    headersMock.mockResolvedValue(new Headers());
    const { getUserRole } = await import("../roles");

    await expect(getUserRole()).resolves.toBeUndefined();
  });

  it("returns undefined when the header has an unrecognized value", async () => {
    headersMock.mockResolvedValue(new Headers({ "x-user-role": "bogus" }));
    const { getUserRole } = await import("../roles");

    await expect(getUserRole()).resolves.toBeUndefined();
  });
});
