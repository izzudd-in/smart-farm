import { redirect } from "next/navigation";
import type { UserRole } from "@/generated/prisma/enums";

import { getCurrentUser } from "@/server/auth/current-user";
import { AUTH_ROUTES, getRoleHome } from "@/features/auth/routes";

import type { AuthUser } from "@/features/auth/types/auth";

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }

  return user;
}

export async function requireRole(
  allowedRoles: UserRole | UserRole[],
): Promise<AuthUser> {
  const user = await requireUser();

  const roles = Array.isArray(allowedRoles)
    ? allowedRoles
    : [allowedRoles];

  if (!roles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }

  return user;
}

export async function requirePageUser(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect(AUTH_ROUTES.login);
  }

  return user;
}

export async function requirePageRole(
  allowedRoles: UserRole | UserRole[],
): Promise<AuthUser> {
  const user = await requirePageUser();

  const roles = Array.isArray(allowedRoles)
    ? allowedRoles
    : [allowedRoles];

  if (!roles.includes(user.role)) {
    redirect(getRoleHome(user.role));
  }

  return user;
}