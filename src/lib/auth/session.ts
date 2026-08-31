import {
  SignJWT,
  jwtVerify,
} from "jose";

import {
  cookies,
} from "next/headers";

import {
  env,
} from "@/lib/env";

import type { UserRole } from "@/generated/prisma/enums";

export const SESSION_COOKIE_NAME =
  "smart_farm_session";

export const SESSION_DURATION_SECONDS =
  60 * 60 * 24 * 7;

function getSessionSecret(): Uint8Array {
  return new TextEncoder().encode(
    env.AUTH_SECRET,
  );
}

export function getCookieSecurityOptions() {
  return {
    httpOnly:
      true,

    secure:
      env.IS_HTTPS,

    sameSite:
      "lax" as const,

    path:
      "/",

    maxAge:
      SESSION_DURATION_SECONDS,
  };
}

export type SessionPayload = {
  userId: string;
  role?: UserRole;
  exp?: number;
  iat?: number;
};

export function shouldRefreshSession(
  session: SessionPayload,
): boolean {
  if (!session.exp || !session.iat) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  const age = now - session.iat;
  const remaining = session.exp - now;

  // Refresh jika token sudah berusia > 1 hari atau sisa waktu <= 3 hari
  return (
    age >= 24 * 60 * 60 ||
    remaining <= 3 * 24 * 60 * 60
  );
}

export async function signSessionToken(
  userId: string,
  role?: UserRole,
): Promise<string> {
  return new SignJWT(role ? { role } : {})
    .setProtectedHeader({
      alg:
        "HS256",
    })
    .setSubject(
      userId,
    )
    .setIssuedAt()
    .setExpirationTime(
      "7d",
    )
    .sign(
      getSessionSecret(),
    );
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(
      token,
      getSessionSecret(),
      {
        algorithms: ["HS256"],
      },
    );

    if (typeof payload.sub !== "string") {
      return null;
    }

    return {
      userId: payload.sub,
      role: (payload.role as UserRole) ?? undefined,
      exp: payload.exp,
      iat: payload.iat,
    };
  } catch {
    return null;
  }
}

export async function createSession(
  userId: string,
  role?: UserRole,
): Promise<void> {
  const token = await signSessionToken(
    userId,
    role,
  );

  const cookieStore =
    await cookies();

  cookieStore.set(
    SESSION_COOKIE_NAME,
    token,
    getCookieSecurityOptions(),
  );
}

export async function getSessionPayload(): Promise<
  SessionPayload | null
> {
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      SESSION_COOKIE_NAME,
    )?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export async function getSessionUserId(): Promise<
  string | null
> {
  const session =
    await getSessionPayload();

  return session?.userId ?? null;
}

export async function clearSession(): Promise<void> {
  const cookieStore =
    await cookies();

  cookieStore.set(
    SESSION_COOKIE_NAME,
    "",
    {
      ...getCookieSecurityOptions(),

      expires:
        new Date(0),

      maxAge:
        0,
    },
  );
}