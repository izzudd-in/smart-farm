import { verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/prisma";

import type { AuthUser } from "@/features/auth/types/auth";

export async function authenticateUser(
  email: string,
  password: string,
): Promise<AuthUser | null> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  const passwordValid = await verifyPassword(
    password,
    user.passwordHash,
  );

  if (!passwordValid) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}