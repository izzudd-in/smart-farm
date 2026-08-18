import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";

import type { FarmPageData } from "@/features/farm/types/farm";
import { calculateFlockAge } from "@/features/farm/utils/flock-age";

export async function getFarmPageData(): Promise<FarmPageData | null> {
  const [farm, operators] =
    await Promise.all([
      prisma.farm.findUnique({
        where: {
          scope: "PRIMARY",
        },
        select: {
          id: true,
          code: true,
          name: true,
          isActive: true,
          kandangs: {
            orderBy: [
              {
                code: "asc",
              },
              {
                name: "asc",
              },
            ],
            select: {
              id: true,
              code: true,
              name: true,
              isActive: true,
              operators: {
                orderBy: {
                  name: "asc",
                },
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              activeFlock: {
                select: {
                  id: true,
                  name: true,
                  startDate: true,
                  initialPopulation: true,
                },
              },
            },
          },
        },
      }),

      prisma.user.findMany({
        where: {
          role: UserRole.OPERATOR,
          isActive: true,
        },
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      }),
    ]);

  if (!farm) {
    return null;
  }

  return {
    id: farm.id,
    code: farm.code,
    name: farm.name,
    isActive: farm.isActive,
    operators,
    kandangs: farm.kandangs.map(
      (kandang) => {
        const activeFlock =
          kandang.activeFlock;

        if (!activeFlock) {
          return {
            ...kandang,
            activeFlock: null,
          };
        }

        const age = calculateFlockAge(
          activeFlock.startDate,
        );

        return {
          ...kandang,
          activeFlock: {
            id: activeFlock.id,
            name: activeFlock.name,
            startDate:
              activeFlock.startDate
                .toISOString()
                .slice(0, 10),
            initialPopulation:
              activeFlock.initialPopulation,
            ageDays: age.totalDays,
            ageLabel: age.label,
          },
        };
      },
    ),
  };
}