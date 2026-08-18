"use server";

import { redirect } from "next/navigation";

import { AUTH_ROUTES } from "@/features/auth/routes";
import { clearSession } from "@/lib/auth/session";

export async function logout(): Promise<void> {
  await clearSession();

  redirect(AUTH_ROUTES.login);
}