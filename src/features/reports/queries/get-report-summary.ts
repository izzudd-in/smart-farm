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
  getDailyReportStatus,
} from "@/features/daily-operations/utils/status";

import {
  getProfitForPeriod,
} from "@/features/finance/queries/get-profit";

import {
  getEggStockAsOfDate,
} from "@/features/inventory/queries/get-egg-stock";

import {
  getFeedStockAsOfDate,
} from "@/features/inventory/queries/get-feed-stock";

import {
  quantityToMilliKg,
} from "@/features/inventory/utils/quantity";

import type {
  ReportSummaryForPeriod,
} from "@/features/reports/types/report";

import {
  calculateDamageRatePercent,
  calculateSnapshotFeedUsageMilliKg,
  reportMilliKgToQuantity,
} from "@/features/reports/utils/report-calculation";

type FeedUsageAccumulator = {
  ingredientId: string;
  ingredientName: string;
  usageMilliKg: bigint;
};

export async function getReportSummaryForPeriod(
  from: Date,
  to: Date,
): Promise<ReportSummaryForPeriod> {
  await requireRole(
    UserRole.OWNER,
  );

  if (
    from > to
  ) {
    throw new Error(
      "Periode laporan tidak valid.",
    );
  }

  /*
   * Profit menjadi orchestration source
   * untuk Sales + HPP + Profit.
   *
   * getProfitForPeriod() sendiri hanya
   * memanggil getHppForPeriod() satu kali.
   *
   * DailyReport diambil satu batch tambahan
   * karena Reports membutuhkan damaged egg,
   * mortality, serta feed usage breakdown
   * yang memang tidak menjadi output HPP.
   *
   * Inventory menggunakan closing balance
   * as-of filter.to.
   */
  const [
    profit,
    reports,
    eggStock,
    feedStock,
  ] = await Promise.all([
    getProfitForPeriod(
      from,
      to,
    ),

    prisma.dailyReport.findMany({
      where: {
        date: {
          gte:
            from,

          lte:
            to,
        },

        kandang: {
          farm: {
            scope:
              "PRIMARY",
          },
        },
      },

      orderBy: [
        {
          date:
            "asc",
        },
        {
          createdAt:
            "asc",
        },
      ],

      select: {
        date:
          true,

        saleableEgg:
          true,

        damagedEgg:
          true,

        feedUsed:
          true,

        mortality:
          true,

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

    getEggStockAsOfDate(
      to,
    ),

    getFeedStockAsOfDate(
      to,
    ),
  ]);

  let saleableEggMilliKg =
    BigInt(0);

  let damagedEggMilliKg =
    BigInt(0);

  let feedUsedMilliKg =
    BigInt(0);

  let mortalityCount =
    0;

  let completeReports =
    0;

  let incompleteReports =
    0;

  const feedUsageMap =
    new Map<
      string,
      FeedUsageAccumulator
    >();

  for (
    const report
    of reports
  ) {
    const status =
      getDailyReportStatus(
        report,
      );

    if (
      status !==
      "COMPLETE"
    ) {
      incompleteReports +=
        1;

      continue;
    }

    completeReports +=
      1;

    const saleableEgg =
      report.saleableEgg ??
      0;

    const damagedEgg =
      report.damagedEgg ??
      0;

    const feedUsed =
      report.feedUsed ??
      0;

    saleableEggMilliKg +=
      quantityToMilliKg(
        saleableEgg,
      );

    damagedEggMilliKg +=
      quantityToMilliKg(
        damagedEgg,
      );

    feedUsedMilliKg +=
      quantityToMilliKg(
        feedUsed,
      );

    mortalityCount +=
      report.mortality ??
      0;

    for (
      const item
      of report.feedItems
    ) {
      const usageMilliKg =
        calculateSnapshotFeedUsageMilliKg(
          feedUsed,
          item.percentage.toString(),
        );

      const existing =
        feedUsageMap.get(
          item.ingredientId,
        );

      if (
        existing
      ) {
        existing.usageMilliKg +=
          usageMilliKg;

        /*
         * Label tetap berasal dari historical
         * DailyReportFeedItem snapshot.
         *
         * Bila ingredient pernah berganti nama,
         * snapshot terakhir di periode dipakai
         * sebagai label presentasi, bukan current
         * FeedIngredient.name.
         */
        existing.ingredientName =
          item.ingredientNameSnapshot;

        continue;
      }

      feedUsageMap.set(
        item.ingredientId,
        {
          ingredientId:
            item.ingredientId,

          ingredientName:
            item.ingredientNameSnapshot,

          usageMilliKg,
        },
      );
    }
  }

  const saleableEggKg =
    reportMilliKgToQuantity(
      saleableEggMilliKg,
    );

  const damagedEggKg =
    reportMilliKgToQuantity(
      damagedEggMilliKg,
    );

  const totalEggKg =
    reportMilliKgToQuantity(
      saleableEggMilliKg +
        damagedEggMilliKg,
    );

  const feedIngredients =
    Array.from(
      feedUsageMap.values(),
    )
      .map(
        (
          ingredient,
        ) => ({
          ingredientId:
            ingredient.ingredientId,

          ingredientName:
            ingredient.ingredientName,

          usageKg:
            reportMilliKgToQuantity(
              ingredient.usageMilliKg,
            ),
        }),
      )
      .sort(
        (
          a,
          b,
        ) =>
          a.ingredientName.localeCompare(
            b.ingredientName,
            "id-ID",
          ),
      );

  const dataQualityWarnings =
    Array.from(
      new Set([
        ...profit.warnings,

        ...(incompleteReports >
        0
          ? [
              `${incompleteReports} laporan operasional pada periode ini belum lengkap.`,
            ]
          : []),

        ...(profit.hpp
          .missingFeedCostReportCount >
        0
          ? [
              `${profit.hpp.missingFeedCostReportCount} laporan lengkap belum memiliki snapshot biaya pakan yang lengkap.`,
            ]
          : []),
      ]),
    );

  return {
    period: {
      from:
        from
          .toISOString()
          .slice(
            0,
            10,
          ),

      to:
        to
          .toISOString()
          .slice(
            0,
            10,
          ),
    },

    production: {
      saleableEggKg,

      damagedEggKg,

      totalEggKg,

      damageRatePercent:
        calculateDamageRatePercent(
          saleableEggKg,
          damagedEggKg,
        ),

      mortalityCount,

      feedUsedKg:
        reportMilliKgToQuantity(
          feedUsedMilliKg,
        ),

      feedIngredients,
    },

    sales: {
      revenue:
        profit.revenue,

      soldKg:
        profit.soldKg,

      orderCount:
        profit.orderCount,

      averageSellingPricePerKg:
        profit.averageSellingPricePerKg,
    },

    inventory: {
      asOfDate:
        eggStock.asOfDate,

      eggStockKg:
        eggStock.currentStockKg,

      eggStockNegative:
        eggStock.isNegative,

      feedStocks:
        feedStock.ingredients.map(
          (
            ingredient,
          ) => ({
            ingredientId:
              ingredient.ingredientId,

            ingredientName:
              ingredient.ingredientName,

            stockKg:
              ingredient.currentStockKg,

            isNegative:
              ingredient.isNegative,
          }),
        ),
    },

    cost: {
      feedCost:
        profit.hpp.feedCost,

      routineCost:
        profit.hpp.routineCost,

      dailyExpenseCost:
        profit.hpp.dailyExpenseCost,

      totalOperationalCost:
        profit.hpp.totalOperationalCost,
    },

    hpp: {
      hppPerKg:
        profit.hpp.hppPerKg,

      status:
        profit.hpp.status,
    },

    profit: {
      estimatedOperationalProfit:
        profit.estimatedOperationalProfit,

      operationalMarginPercent:
        profit.operationalMarginPercent,

      status:
        profit.status,
    },

    dataQuality: {
      completeReports,

      incompleteReports,

      missingFeedCostReports:
        profit.hpp
          .missingFeedCostReportCount,

      hppStatus:
        profit.hpp.status,

      profitStatus:
        profit.status,

      warnings:
        dataQualityWarnings,
    },
  };
}