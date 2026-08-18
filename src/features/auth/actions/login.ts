"use server";

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

  const user = await authenticateUser(email, password);

  if (!user) {
    return {
      success: false,
      error: "Email atau password salah.",
    };
  }

  await createSession(user.id);

  return {
    success: true,
    user,
  };
}