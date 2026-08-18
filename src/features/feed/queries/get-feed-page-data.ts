import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/server/auth/guards";

import type { FeedPageData } from "@/features/feed/types/feed";
import {
  calculateFormulaCost,
  calculateFormulaTotalPercentage,
} from "@/features/feed/utils/calculations";

export async function getFeedPageData(): Promise<FeedPageData | null> {
  await requireRole(UserRole.OWNER);

  const farm =
    await prisma.farm.findUnique({
      where: {
        scope: "PRIMARY",
      },

      select: {
        id: true,
      },
    });

  if (!farm) {
    return null;
  }

  const [
    ingredientRecords,
    formulaRecords,
  ] = await Promise.all([
    prisma.feedIngredient.findMany({
      where: {
        farmId: farm.id,
      },

      orderBy: {
        name: "asc",
      },

      select: {
        id: true,
        name: true,
        unit: true,
        currentPricePerKg: true,
        isActive: true,
      },
    }),

    prisma.feedFormula.findMany({
      where: {
        farmId: farm.id,
      },

      orderBy: {
        name: "asc",
      },

      select: {
        id: true,
        name: true,
        isActive: true,

        items: {
          orderBy: {
            ingredient: {
              name: "asc",
            },
          },

          select: {
            percentage: true,

            ingredient: {
              select: {
                id: true,
                name: true,
                isActive: true,
                currentPricePerKg: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const ingredients =
    ingredientRecords.map(
      (ingredient) => ({
        id: ingredient.id,
        name: ingredient.name,
        unit: ingredient.unit,

        currentPricePerKg:
          ingredient.currentPricePerKg.toString(),

        isActive:
          ingredient.isActive,
      }),
    );

  const formulas =
    formulaRecords
      .map((formula) => {
        const items =
          formula.items.map(
            (item) => ({
              ingredientId:
                item.ingredient.id,

              ingredientName:
                item.ingredient.name,

              ingredientIsActive:
                item.ingredient
                  .isActive,

              percentage:
                item.percentage.toString(),

              currentPricePerKg:
                item.ingredient.currentPricePerKg.toString(),
            }),
          );

        const calculationItems =
          items.map((item) => ({
            percentage: Number(
              item.percentage,
            ),

            currentPricePerKg:
              Number(
                item.currentPricePerKg,
              ),
          }));

        return {
          id: formula.id,
          name: formula.name,
          isActive:
            formula.isActive,

          items,

          totalPercentage:
            calculateFormulaTotalPercentage(
              calculationItems,
            ),

          estimatedCostPerKg:
            calculateFormulaCost(
              calculationItems,
            ),
        };
      })
      .sort(
        (a, b) =>
          Number(b.isActive) -
            Number(a.isActive) ||
          a.name.localeCompare(
            b.name,
          ),
      );

  return {
    ingredients,
    formulas,
  };
}