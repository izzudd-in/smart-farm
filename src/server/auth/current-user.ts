import { getSessionUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

import type { AuthUser } from "@/features/auth/types/auth";

export async function getCurrentUser(): Promise<AuthUser | null> {
  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}