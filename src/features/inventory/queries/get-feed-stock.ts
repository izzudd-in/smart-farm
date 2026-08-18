import {
  FeedStockAdjustmentType,
  UserRole,
} from "@/generated/prisma/enums";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/server/auth/guards";

import {
  getJakartaTodayDate,
} from "@/features/daily-operations/utils/date";

import {
  percentageToBasisPoints,
} from "@/features/feed/schemas/feed";

import type {
  FeedInventoryData,
  FeedStockAsOfData,
  FeedStockIngredientSummary,
  FeedStockMovement,
} from "@/features/inventory/types/inventory";

import {
  applyBasisPointsToMilliKg,
  milliKgToQuantity,
  quantityToMilliKg,
} from "@/features/inventory/utils/quantity";

import {
  getCompleteDailyReportStockWhere,
} from "@/features/inventory/queries/stock-source-filters";

type IngredientAccumulator = {
  opening: bigint;
  purchase: bigint;
  usage: bigint;
  increase: bigint;
  decrease: bigint;
};

function createAccumulator(): IngredientAccumulator {
  return {
    opening: BigInt(0),
    purchase: BigInt(0),
    usage: BigInt(0),
    increase: BigInt(0),
    decrease: BigInt(0),
  };
}

function getAccumulator(
  map: Map<
    string,
    IngredientAccumulator
  >,
  ingredientId: string,
): IngredientAccumulator {
  let accumulator =
    map.get(
      ingredientId,
    );

  if (!accumulator) {
    accumulator =
      createAccumulator();

    map.set(
      ingredientId,
      accumulator,
    );
  }

  return accumulator;
}

function calculateUsageMilliKg(
  feedUsed: number,
  percentage: string,
): bigint {
  const feedMilliKg =
    quantityToMilliKg(
      feedUsed,
    );

  const basisPoints =
    percentageToBasisPoints(
      percentage,
    );

  return applyBasisPointsToMilliKg(
    feedMilliKg,
    basisPoints,
  );
}

export async function getFeedStockAsOfDate(
  date: Date,
): Promise<FeedStockAsOfData> {
  const [
    ingredients,
    purchases,
    adjustments,
    reports,
    openingRecords,
  ] = await Promise.all([
    prisma.feedIngredient.findMany({
      where: {
        farm: {
          scope:
            "PRIMARY",
        },
      },

      orderBy: {
        name: "asc",
      },

      select: {
        id: true,
        name: true,
        isActive:
          true,
      },
    }),

    prisma.feedPurchase.groupBy({
      by: [
        "ingredientId",
      ],

      where: {
        purchasedAt: {
          lte: date,
        },

        farm: {
          scope:
            "PRIMARY",
        },
      },

      _sum: {
        quantityKg:
          true,
      },
    }),

    prisma.feedStockAdjustment.groupBy({
      by: [
        "ingredientId",
        "type",
      ],

      where: {
        occurredAt: {
          lte: date,
        },

        farm: {
          scope:
            "PRIMARY",
        },
      },

      _sum: {
        quantityKg:
          true,
      },
    }),

    prisma.dailyReport.findMany({
      where:
        getCompleteDailyReportStockWhere(
          date,
        ),

      select: {
        feedUsed:
          true,

        feedItems: {
          select: {
            ingredientId:
              true,
            percentage:
              true,
          },
        },
      },
    }),

    // Global existence check.
    // Tidak dibatasi as-of agar CTA opening kedua tidak muncul
    // ketika user sedang melihat tanggal sebelum opening.
    prisma.feedStockAdjustment.findMany({
      where: {
        type:
          FeedStockAdjustmentType.OPENING,

        farm: {
          scope:
            "PRIMARY",
        },
      },

      select: {
        ingredientId:
          true,
      },
    }),
  ]);

  const openingIngredientIds =
    new Set(
      openingRecords.map(
        (record) =>
          record.ingredientId,
      ),
    );

  const accumulatorMap =
    new Map<
      string,
      IngredientAccumulator
    >();

  for (
    const purchase
    of purchases
  ) {
    const accumulator =
      getAccumulator(
        accumulatorMap,
        purchase.ingredientId,
      );

    accumulator.purchase +=
      quantityToMilliKg(
        purchase._sum
          .quantityKg
          ?.toString() ??
          "0",
      );
  }

  for (
    const adjustment
    of adjustments
  ) {
    const accumulator =
      getAccumulator(
        accumulatorMap,
        adjustment.ingredientId,
      );

    const quantity =
      quantityToMilliKg(
        adjustment._sum
          .quantityKg
          ?.toString() ??
          "0",
      );

    switch (
      adjustment.type
    ) {
      case FeedStockAdjustmentType.OPENING:
        accumulator.opening +=
          quantity;
        break;

      case FeedStockAdjustmentType.INCREASE:
        accumulator.increase +=
          quantity;
        break;

      case FeedStockAdjustmentType.DECREASE:
        accumulator.decrease +=
          quantity;
        break;
    }
  }

  for (
    const report
    of reports
  ) {
    if (
      report.feedUsed ===
      null
    ) {
      continue;
    }

    for (
      const item
      of report.feedItems
    ) {
      const accumulator =
        getAccumulator(
          accumulatorMap,
          item.ingredientId,
        );

      accumulator.usage +=
        calculateUsageMilliKg(
          report.feedUsed,
          item.percentage.toString(),
        );
    }
  }

  const ingredientSummaries:
    FeedStockIngredientSummary[] =
      ingredients.map(
        (ingredient) => {
          const accumulator =
            accumulatorMap.get(
              ingredient.id,
            ) ??
            createAccumulator();

          const adjustmentNet =
            accumulator.increase -
            accumulator.decrease;

          const currentStock =
            accumulator.opening +
            accumulator.purchase +
            adjustmentNet -
            accumulator.usage;

          return {
            ingredientId:
              ingredient.id,

            ingredientName:
              ingredient.name,

            isActive:
              ingredient.isActive,

            openingKg:
              milliKgToQuantity(
                accumulator.opening,
              ),

            purchaseKg:
              milliKgToQuantity(
                accumulator.purchase,
              ),

            usageKg:
              milliKgToQuantity(
                accumulator.usage,
              ),

            adjustmentNetKg:
              milliKgToQuantity(
                adjustmentNet,
              ),

            currentStockKg:
              milliKgToQuantity(
                currentStock,
              ),

            hasOpening:
              openingIngredientIds.has(
                ingredient.id,
              ),

            isNegative:
              currentStock <
              BigInt(0),
          };
        },
      );

  return {
    asOfDate:
      date
        .toISOString()
        .slice(0, 10),

    ingredients:
      ingredientSummaries,
  };
}

export async function getFeedInventoryData(
  asOfDate =
    getJakartaTodayDate(),
): Promise<FeedInventoryData> {
  await requireRole(
    UserRole.OWNER,
  );

  const [
    stock,
    ingredients,
    purchases,
    adjustments,
    reports,
  ] = await Promise.all([
    getFeedStockAsOfDate(
      asOfDate,
    ),

    prisma.feedIngredient.findMany({
      where: {
        farm: {
          scope:
            "PRIMARY",
        },
      },

      orderBy: {
        name: "asc",
      },

      select: {
        id: true,
        name: true,
        isActive:
          true,
      },
    }),

    prisma.feedPurchase.findMany({
      where: {
        purchasedAt: {
          lte:
            asOfDate,
        },

        farm: {
          scope:
            "PRIMARY",
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

      take: 100,

      select: {
        id: true,
        purchasedAt:
          true,
        quantityKg:
          true,
        unitPricePerKg:
          true,
        totalPrice:
          true,
        supplier:
          true,
        note: true,
        createdAt:
          true,

        ingredient: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),

    prisma.feedStockAdjustment.findMany({
      where: {
        occurredAt: {
          lte:
            asOfDate,
        },

        farm: {
          scope:
            "PRIMARY",
        },
      },

      orderBy: [
        {
          occurredAt:
            "desc",
        },
        {
          createdAt:
            "desc",
        },
      ],

      take: 100,

      select: {
        id: true,
        occurredAt:
          true,
        type: true,
        quantityKg:
          true,
        note: true,
        createdAt:
          true,

        ingredient: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),

    prisma.dailyReport.findMany({
      where:
        getCompleteDailyReportStockWhere(
          asOfDate,
        ),

      orderBy: [
        {
          date: "desc",
        },
        {
          createdAt:
            "desc",
        },
      ],

      take: 100,

      select: {
        id: true,
        date: true,
        feedUsed:
          true,
        createdAt:
          true,

        feedFormulaNameSnapshot:
          true,

        kandang: {
          select: {
            name: true,
          },
        },

        feedItems: {
          select: {
            ingredientId:
              true,

            ingredientNameSnapshot:
              true,

            percentage:
              true,
          },
        },
      },
    }),
  ]);

  const movements:
    FeedStockMovement[] = [
      ...purchases.map(
        (
          purchase,
        ): FeedStockMovement => ({
          id:
            `purchase:${purchase.id}`,

          type:
            "PURCHASE",

          direction:
            "IN",

          ingredientId:
            purchase.ingredient.id,

          ingredientName:
            purchase.ingredient.name,

          occurredAt:
            purchase.purchasedAt
              .toISOString()
              .slice(
                0,
                10,
              ),

          createdAt:
            purchase.createdAt.toISOString(),

          title:
            "Pembelian",

          subtitle:
            purchase.supplier ??
            purchase.note,

          quantityKg:
            purchase.quantityKg.toString(),

          unitPricePerKg:
            purchase.unitPricePerKg.toString(),

          totalPrice:
            purchase.totalPrice.toString(),
        }),
      ),

      ...adjustments.map(
        (
          adjustment,
        ): FeedStockMovement => {
          const opening =
            adjustment.type ===
            FeedStockAdjustmentType.OPENING;

          const increase =
            adjustment.type ===
            FeedStockAdjustmentType.INCREASE;

          return {
            id:
              `adjustment:${adjustment.id}`,

            type:
              opening
                ? "OPENING"
                : increase
                  ? "ADJUSTMENT_IN"
                  : "ADJUSTMENT_OUT",

            direction:
              adjustment.type ===
              FeedStockAdjustmentType.DECREASE
                ? "OUT"
                : "IN",

            ingredientId:
              adjustment.ingredient.id,

            ingredientName:
              adjustment.ingredient.name,

            occurredAt:
              adjustment.occurredAt
                .toISOString()
                .slice(
                  0,
                  10,
                ),

            createdAt:
              adjustment.createdAt.toISOString(),

            title:
              opening
                ? "Stok Awal"
                : increase
                  ? "Koreksi Masuk"
                  : "Koreksi Keluar",

            subtitle:
              adjustment.note,

            quantityKg:
              adjustment.quantityKg.toString(),

            unitPricePerKg:
              null,

            totalPrice:
              null,
          };
        },
      ),

      ...reports.flatMap(
        (report) => {
          if (
            report.feedUsed ===
            null
          ) {
            return [];
          }

          return report.feedItems.map(
            (
              item,
            ): FeedStockMovement => {
              const percentage =
                item.percentage.toString();

              const usage =
                calculateUsageMilliKg(
                  report.feedUsed!,
                  percentage,
                );

              return {
                id:
                  `usage:${report.id}:${item.ingredientId}`,

                type:
                  "USAGE",

                direction:
                  "OUT",

                ingredientId:
                  item.ingredientId,

                // Historical label memakai snapshot DailyReport,
                // bukan current FeedIngredient.name.
                ingredientName:
                  item.ingredientNameSnapshot,

                occurredAt:
                  report.date
                    .toISOString()
                    .slice(
                      0,
                      10,
                    ),

                createdAt:
                  report.createdAt.toISOString(),

                title:
                  `Pemakaian · ${report.kandang.name}`,

                subtitle:
                  `${report.feedFormulaNameSnapshot ?? "Formula tersimpan"} · ${Number(
                    percentage,
                  ).toLocaleString(
                    "id-ID",
                    {
                      maximumFractionDigits:
                        2,
                    },
                  )}%`,

                quantityKg:
                  milliKgToQuantity(
                    usage,
                  ),

                unitPricePerKg:
                  null,

                totalPrice:
                  null,
              };
            },
          );
        },
      ),
    ]
      .sort(
        (a, b) => {
          const dateOrder =
            b.occurredAt.localeCompare(
              a.occurredAt,
            );

          if (
            dateOrder !==
            0
          ) {
            return dateOrder;
          }

          return b.createdAt.localeCompare(
            a.createdAt,
          );
        },
      )
      .slice(
        0,
        150,
      );

  return {
    asOfDate:
      stock.asOfDate,

    ingredients:
      stock.ingredients,

    ingredientOptions:
      ingredients,

    movements,
  };
}