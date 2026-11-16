import { NextResponse, type NextRequest } from "next/server";

/**
 * Keeps the two pages that break on purpose (used by the tests to see the error pages) out of the real app: unless the server
 * was started with PLINTH_TEST_ROUTES=1, they answer with the ordinary 404 page and its 404 status.
 */
export function proxy(request: NextRequest) {
  if (process.env.PLINTH_TEST_ROUTES === "1") return NextResponse.next();
  return NextResponse.rewrite(new URL("/page-not-found", request.url));
}

export const config = { matcher: ["/test-crash", "/app/test-crash"] };
