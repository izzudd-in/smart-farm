import {
  UserRole,
} from "@/generated/prisma/enums";

import {
  prisma,
} from "@/lib/db/prisma";

import {
  requireRole,
} from "@/server/auth/guards";

import {
  BUSINESS_TIMEZONE,
  type OwnerSettingsData,
} from "@/features/settings/types/settings";

export async function getOwnerSettingsData(): Promise<OwnerSettingsData> {
  const sessionUser =
    await requireRole(
      UserRole.OWNER,
    );

  const [
    user,
    farm,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id:
          sessionUser.id,
      },

      select: {
        id:
          true,

        name:
          true,

        email:
          true,

        role:
          true,

        isActive:
          true,
      },
    }),

    prisma.farm.findUnique({
      where: {
        scope:
          "PRIMARY",
      },

      select: {
        name:
          true,
      },
    }),
  ]);

  if (
    !user ||
    !user.isActive ||
    user.role !==
      UserRole.OWNER
  ) {
    throw new Error(
      "FORBIDDEN",
    );
  }

  return {
    name:
      user.name,

    email:
      user.email,

    role:
      "OWNER",

    farmName:
      farm?.name ??
      null,

    timezone:
      BUSINESS_TIMEZONE,
  };
}