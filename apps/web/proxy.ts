import { NextResponse, type NextRequest } from "next/server";

/** Set by the API next to the refresh cookie; holds no secret, only "a session exists" */
const SESSION_HINT_COOKIE = "ig_session";
const AUTH_PAGES = ["/login", "/register", "/reset-password"];

/**
 * Redirects before anything renders:
 * guests → /login (remembering where they wanted to go), signed-in users away from auth pages.
 * The real check happens in the API; a stale hint only costs one extra redirect.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_HINT_COOKIE);
  const isAuthPage = AUTH_PAGES.some((page) => pathname === page || pathname.startsWith(`${page}/`));

  if (!hasSession && !isAuthPage) {
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  if (hasSession && isAuthPage) {
    const next = request.nextUrl.searchParams.get("next");
    // Only same-site paths: "//evil.com" or absolute URLs must never become a redirect target
    const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Everything except the API, Next.js internals, media and files with an extension
    "/((?!api/|_next/|media-files/|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)",
  ],
};
