import {
  FeedCostBasis,
} from "@/generated/prisma/enums";

import {
  prisma,
} from "@/lib/db/prisma";

type FeedCostResolverDb = Pick<
  typeof prisma,
  "feedPurchase" | "feedIngredient"
>;

export type ResolvedFeedUnitCost = {
  unitCostPerKg: string;
  basis: FeedCostBasis;
};

type ResolveFeedUnitCostInput = {
  farmId: string;
  ingredientId: string;
  date: Date;
};

export async function resolveFeedUnitCostForDate(
  input: ResolveFeedUnitCostInput,
  db: FeedCostResolverDb = prisma,
): Promise<ResolvedFeedUnitCost> {
  const purchase =
    await db.feedPurchase.findFirst({
      where: {
        farmId:
          input.farmId,

        ingredientId:
          input.ingredientId,

        purchasedAt: {
          lte:
            input.date,
        },
      },

      orderBy: [
        {
          purchasedAt:
            "desc",
        },
        {
          createdAt:
            "desc",
        },
      ],

      select: {
        unitPricePerKg:
          true,
      },
    });

  if (purchase) {
    return {
      unitCostPerKg:
        purchase.unitPricePerKg.toString(),

      basis:
        FeedCostBasis.LATEST_PURCHASE,
    };
  }

  const ingredient =
    await db.feedIngredient.findFirst({
      where: {
        id:
          input.ingredientId,

        farmId:
          input.farmId,
      },

      select: {
        currentPricePerKg:
          true,
      },
    });

  if (!ingredient) {
    throw new Error(
      "Feed ingredient tidak ditemukan saat resolve feed cost.",
    );
  }

  return {
    unitCostPerKg:
      ingredient.currentPricePerKg.toString(),

    basis:
      FeedCostBasis.MASTER_PRICE,
  };
}