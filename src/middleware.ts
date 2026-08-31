import { NextResponse, type NextRequest } from "next/server";
import { UserRole } from "@/generated/prisma/enums";
import {
  SESSION_COOKIE_NAME,
  getCookieSecurityOptions,
  shouldRefreshSession,
  signSessionToken,
  verifySessionToken,
} from "@/lib/auth/session";

const OWNER_ROUTE_PREFIXES = [
  "/dashboard",
  "/farm",
  "/feed",
  "/sales",
  "/settings",
  "/hpp",
  "/reports",
  "/daily",
  "/expenses",
  "/inventory",
  "/production",
];

const OPERATOR_ROUTE_PREFIXES = ["/operator"];

const PUBLIC_API_ROUTES = ["/api/health"];

function isMatchingPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip public static files or internal Next.js paths
  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 2. Extract & verify session token
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // Helper to attach refreshed token for sliding expiry
  const withSlidingSession = async (
    response: NextResponse,
  ): Promise<NextResponse> => {
    if (session && shouldRefreshSession(session)) {
      const refreshedToken = await signSessionToken(
        session.userId,
        session.role,
      );

      response.cookies.set(
        SESSION_COOKIE_NAME,
        refreshedToken,
        getCookieSecurityOptions(),
      );
    }

    return response;
  };

  // 3. API-level protection for /api/*
  if (pathname.startsWith("/api")) {
    if (PUBLIC_API_ROUTES.includes(pathname)) {
      return NextResponse.next();
    }

    if (!session) {
      return NextResponse.json(
        { error: "UNAUTHENTICATED", message: "Autentikasi diperlukan." },
        { status: 401 },
      );
    }

    return withSlidingSession(NextResponse.next());
  }

  // 4. Root "/" navigation handling
  if (pathname === "/") {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const homeUrl =
      session.role === UserRole.OWNER ? "/dashboard" : "/operator/today";
    return withSlidingSession(
      NextResponse.redirect(new URL(homeUrl, request.url)),
    );
  }

  // 5. Auth / Login page handling: let LoginPage handle database-backed check to avoid redirect loops
  if (pathname === "/login") {
    return NextResponse.next();
  }

  // 6. Owner routes protection (/dashboard, /farm, /feed, /sales, /settings, /hpp, /reports, etc.)
  if (isMatchingPrefix(pathname, OWNER_ROUTE_PREFIXES)) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (session.role === UserRole.OPERATOR) {
      return withSlidingSession(
        NextResponse.redirect(new URL("/operator/today", request.url)),
      );
    }

    return withSlidingSession(NextResponse.next());
  }

  // 7. Operator routes protection (/operator, /operator/today, etc.)
  if (isMatchingPrefix(pathname, OPERATOR_ROUTE_PREFIXES)) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (session.role === UserRole.OWNER) {
      return withSlidingSession(
        NextResponse.redirect(new URL("/dashboard", request.url)),
      );
    }

    return withSlidingSession(NextResponse.next());
  }

  return withSlidingSession(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
