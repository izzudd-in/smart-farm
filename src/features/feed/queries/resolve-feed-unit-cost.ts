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

export type BatchResolveFeedUnitCostsInput = {
  farmId: string;
  ingredientIds: string[];
  date: Date;
};

export async function resolveBatchFeedUnitCostsForDate(
  input: BatchResolveFeedUnitCostsInput,
  db: FeedCostResolverDb = prisma,
): Promise<Map<string, ResolvedFeedUnitCost>> {
  const result = new Map<string, ResolvedFeedUnitCost>();
  const uniqueIds = Array.from(new Set(input.ingredientIds));

  if (uniqueIds.length === 0) {
    return result;
  }

  // 1. Batch query latest purchases for all ingredientIds in one roundtrip
  const purchases = await db.feedPurchase.findMany({
    where: {
      farmId: input.farmId,
      ingredientId: {
        in: uniqueIds,
      },
      purchasedAt: {
        lte: input.date,
      },
    },
    orderBy: [
      {
        purchasedAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    select: {
      ingredientId: true,
      unitPricePerKg: true,
    },
  });

  // Pick the first (latest) purchase per ingredientId
  for (const purchase of purchases) {
    if (!result.has(purchase.ingredientId)) {
      result.set(purchase.ingredientId, {
        unitCostPerKg: purchase.unitPricePerKg.toString(),
        basis: FeedCostBasis.LATEST_PURCHASE,
      });
    }
  }

  // 2. Identify missing ingredients that have no historical purchase before date
  const missingIngredientIds = uniqueIds.filter((id) => !result.has(id));

  if (missingIngredientIds.length > 0) {
    const ingredients = await db.feedIngredient.findMany({
      where: {
        id: {
          in: missingIngredientIds,
        },
        farmId: input.farmId,
      },
      select: {
        id: true,
        currentPricePerKg: true,
      },
    });

    for (const ingredient of ingredients) {
      result.set(ingredient.id, {
        unitCostPerKg: ingredient.currentPricePerKg.toString(),
        basis: FeedCostBasis.MASTER_PRICE,
      });
    }

    // Verify all missing were resolved
    for (const id of missingIngredientIds) {
      if (!result.has(id)) {
        throw new Error(
          `Feed ingredient ${id} tidak ditemukan saat resolve feed cost.`,
        );
      }
    }
  }

  return result;
}

export async function resolveFeedUnitCostForDate(
  input: ResolveFeedUnitCostInput,
  db: FeedCostResolverDb = prisma,
): Promise<ResolvedFeedUnitCost> {
  const map = await resolveBatchFeedUnitCostsForDate(
    {
      farmId: input.farmId,
      ingredientIds: [input.ingredientId],
      date: input.date,
    },
    db,
  );

  const cost = map.get(input.ingredientId);
  if (!cost) {
    throw new Error(
      "Feed ingredient tidak ditemukan saat resolve feed cost.",
    );
  }

  return cost;
}