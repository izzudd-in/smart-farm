import type { UserRole } from "@/generated/prisma/enums";

import { getCurrentUser } from "@/server/auth/current-user";

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