import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/sign-in", "/sign-up"];

export default clerkMiddleware(async (auth, req) => {
  const isPublicRoute = PUBLIC_PATHS.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  if (!isPublicRoute) {
    await auth.protect();
  }

  // Role is set via publicMetadata.role in the Clerk dashboard and exposed
  // here through a custom session token claim. Forwarded as a request header
  // so it's available for future gating (enforcement itself is Phase 4
  // scope, per requirements.md) without every route re-decoding the session.
  const { sessionClaims } = await auth();
  const role = (
    sessionClaims?.metadata as { role?: "admin" | "operator" } | undefined
  )?.role;

  const requestHeaders = new Headers(req.headers);
  if (role) {
    requestHeaders.set("x-user-role", role);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
