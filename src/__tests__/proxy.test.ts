import { describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware: (handler: unknown) => handler,
}));

function makeAuth({
  signedIn,
  role,
}: {
  signedIn: boolean;
  role?: "admin" | "operator";
}) {
  const auth = Object.assign(
    vi.fn(async () => ({
      userId: signedIn ? "user_123" : null,
      sessionClaims: signedIn ? { metadata: { role } } : null,
    })),
    {
      protect: vi.fn(async () => {
        if (!signedIn) {
          // Mirrors Clerk's real auth.protect(): redirects to sign-in via a
          // thrown control-flow signal rather than a return value.
          throw new Error("redirect-to-sign-in");
        }
      }),
    }
  );
  return auth;
}

function makeRequest(pathname: string): NextRequest {
  return {
    nextUrl: { pathname },
    headers: new Headers(),
  } as unknown as NextRequest;
}

type ProxyHandler = (
  auth: ReturnType<typeof makeAuth>,
  req: NextRequest
) => Promise<unknown>;

async function loadProxy(): Promise<ProxyHandler> {
  const { default: proxy } = await import("../proxy");
  return proxy as unknown as ProxyHandler;
}

describe("proxy", () => {
  it("requires a signed-in user on a protected route", async () => {
    const proxy = await loadProxy();
    const auth = makeAuth({ signedIn: false });

    await expect(proxy(auth, makeRequest("/"))).rejects.toThrow(
      "redirect-to-sign-in"
    );
    expect(auth.protect).toHaveBeenCalled();
  });

  it("allows a signed-in user through on a protected route", async () => {
    const proxy = await loadProxy();
    const auth = makeAuth({ signedIn: true, role: "operator" });

    const response = await proxy(auth, makeRequest("/"));

    expect(auth.protect).toHaveBeenCalled();
    expect(response).toBeDefined();
  });

  it.each(["/sign-in", "/sign-up"])(
    "does not require sign-in on the public route %s",
    async (pathname) => {
      const proxy = await loadProxy();
      const auth = makeAuth({ signedIn: false });

      const response = await proxy(auth, makeRequest(pathname));

      expect(auth.protect).not.toHaveBeenCalled();
      expect(response).toBeDefined();
    }
  );
});
