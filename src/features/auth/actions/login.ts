"use server";

import {
  checkRateLimit,
  getClientIp,
  recordFailedAttempt,
  resetRateLimit,
} from "@/lib/auth/rate-limit";
import { createSession } from "@/lib/auth/session";
import { authenticateUser } from "@/server/auth/authenticate";

import type {
  LoginInput,
  LoginResult,
} from "@/features/auth/types/auth";

export async function login(
  input: LoginInput,
): Promise<LoginResult> {
  const email = input.email?.trim().toLowerCase();
  const password = input.password;

  if (!email || !password) {
    return {
      success: false,
      error: "Email dan password wajib diisi.",
    };
  }

  const clientIp = await getClientIp();
  const rateLimitKey = `${clientIp}:${email}`;

  const rateLimitStatus = checkRateLimit(rateLimitKey);
  if (!rateLimitStatus.allowed) {
    const minutes = Math.max(
      1,
      Math.ceil(rateLimitStatus.retryAfterSeconds / 60),
    );
    return {
      success: false,
      error: `Terlalu banyak percobaan login. Silakan coba lagi dalam ${minutes} menit.`,
    };
  }

  const user = await authenticateUser(email, password);

  if (!user) {
    recordFailedAttempt(rateLimitKey);
    return {
      success: false,
      error: "Email atau password salah.",
    };
  }

  resetRateLimit(rateLimitKey);

  await createSession(user.id, user.role);

  return {
    success: true,
    user,
  };
}