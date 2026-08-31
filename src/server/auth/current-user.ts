import { getSessionPayload } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

import type { AuthUser } from "@/features/auth/types/auth";

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getSessionPayload();

  if (!session?.userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      updatedAt: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  // Session invalidation: jika token diterbitkan sebelum password/akun di-update (toleransi 1 detik clock drift)
  if (
    session.iat &&
    Math.floor(user.updatedAt.getTime() / 1000) > session.iat + 1
  ) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}