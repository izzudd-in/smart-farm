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

const SESSION_COOKIE_NAME =
  "smart_farm_session";

const SESSION_DURATION_SECONDS =
  60 * 60 * 24 * 7;

function getSessionSecret(): Uint8Array {
  return new TextEncoder().encode(
    env.AUTH_SECRET,
  );
}

function getCookieSecurityOptions() {
  return {
    httpOnly:
      true,

    secure:
      env.IS_PRODUCTION,

    sameSite:
      "lax" as const,

    path:
      "/",
  };
}

export async function createSession(
  userId: string,
): Promise<void> {
  const token =
    await new SignJWT({})
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

  const cookieStore =
    await cookies();

  cookieStore.set(
    SESSION_COOKIE_NAME,
    token,
    {
      ...getCookieSecurityOptions(),

      maxAge:
        SESSION_DURATION_SECONDS,
    },
  );
}

export async function getSessionUserId(): Promise<
  string | null
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

  try {
    const {
      payload,
    } =
      await jwtVerify(
        token,
        getSessionSecret(),
        {
          algorithms: [
            "HS256",
          ],
        },
      );

    return typeof payload.sub ===
      "string"
      ? payload.sub
      : null;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore =
    await cookies();

  /*
   * Gunakan atribut security/path yang sama
   * agar penghapusan cookie konsisten dengan
   * cookie saat dibuat.
   */
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