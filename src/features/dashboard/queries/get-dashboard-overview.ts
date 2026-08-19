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
  getJakartaTodayString,
  parseDateOnly,
} from "@/features/daily-operations/utils/date";

import {
  isCoreReportComplete,
} from "@/features/daily-operations/utils/status";

import {
  getProfitForPeriod,
} from "@/features/finance/queries/get-profit";

import {
  getEggStockAsOfDate,
} from "@/features/inventory/queries/get-egg-stock";

import {
  milliKgToQuantity,
  quantityToMilliKg,
} from "@/features/inventory/utils/quantity";

import {
  getEggPriceForDate,
} from "@/features/sales/queries/get-egg-price-for-date";

import type {
  DashboardOverview,
} from "@/features/dashboard/types/dashboard";

export async function getDashboardOverview(): Promise<DashboardOverview> {
  await requireRole(
    UserRole.OWNER,
  );

  /*
   * Semua boundary "hari ini" dan
   * "bulan ini" berasal dari business date
   * Asia/Jakarta.
   */
  const todayString =
    getJakartaTodayString();

  const today =
    parseDateOnly(
      todayString,
    );

  const monthStartString =
    `${todayString.slice(
      0,
      7,
    )}-01`;

  const monthStart =
    parseDateOnly(
      monthStartString,
    );

  /*
   * Semua source independen dijalankan paralel.
   *
   * Tidak menggunakan Reports query karena
   * Dashboard hanya membutuhkan current state.
   */
  const [
    operationalKandangs,
    reportsToday,
    salesToday,
    eggStock,
    profitMonthToDate,
    activeEggPrice,
  ] = await Promise.all([
    /*
     * Expected report hanya untuk kandang
     * yang saat ini aktif dan memiliki
     * active flock.
     *
     * Operator assignment tidak ikut
     * menentukan expected report.
     */
    prisma.kandang.findMany({
      where: {
        isActive:
          true,

        activeFlockId: {
          not:
            null,
        },

        farm: {
          scope:
            "PRIMARY",
        },
      },

      select: {
        id:
          true,
      },
    }),

    /*
     * Satu batch report hari ini.
     * Tidak query per kandang.
     */
    prisma.dailyReport.findMany({
      where: {
        date:
          today,

        kandang: {
          isActive:
            true,

          activeFlockId: {
            not:
              null,
          },

          farm: {
            scope:
              "PRIMARY",
          },
        },
      },

      select: {
        kandangId:
          true,

        saleableEgg:
          true,

        damagedEgg:
          true,

        feedUsed:
          true,

        mortality:
          true,
      },
    }),

    /*
     * Order merupakan immutable transaction
     * snapshot. Tidak join Customer/EggPrice.
     */
    prisma.order.aggregate({
      where: {
        orderedAt:
          today,

        farm: {
          scope:
            "PRIMARY",
        },
      },

      _sum: {
        totalPrice:
          true,

        quantityKg:
          true,
      },

      _count: {
        _all:
          true,
      },
    }),

    getEggStockAsOfDate(
      today,
    ),

    /*
     * Profit engine menjadi satu-satunya
     * source Profit/HPP bulan berjalan.
     * Dashboard tidak memanggil HPP lagi.
     */
    getProfitForPeriod(
      monthStart,
      today,
    ),

    getEggPriceForDate(
      today,
    ),
  ]);

  const expectedReports =
    operationalKandangs.length;

  let completeReports =
    0;

  let incompleteReports =
    0;

  let productionMilliKg =
    BigInt(0);

  const reportedKandangIds =
    new Set<string>();

  for (
    const report
    of reportsToday
  ) {
    reportedKandangIds.add(
      report.kandangId,
    );

    if (
      isCoreReportComplete(
        report,
      )
    ) {
      completeReports +=
        1;

      productionMilliKg +=
        quantityToMilliKg(
          report.saleableEgg ??
            0,
        );

      continue;
    }

    incompleteReports +=
      1;
  }

  const notStartedReports =
    operationalKandangs.reduce(
      (
        total,
        kandang,
      ) =>
        reportedKandangIds.has(
          kandang.id,
        )
          ? total
          : total + 1,
      0,
    );

  const revenueToday =
    salesToday._sum
      .totalPrice
      ?.toString() ??
    "0.00";

  const soldKgToday =
    milliKgToQuantity(
      quantityToMilliKg(
        salesToday._sum
          .quantityKg
          ?.toString() ??
          "0",
      ),
    );

  const productionToday =
    milliKgToQuantity(
      productionMilliKg,
    );

  return {
    today:
      todayString,

    monthToDate: {
      from:
        monthStartString,

      to:
        todayString,
    },

    productionToday: {
      saleableEggKg:
        productionToday,

      completeReports,

      incompleteReports,

      notStartedReports,

      expectedReports,

      isFinal:
        expectedReports >
          0 &&
        completeReports ===
          expectedReports,
    },

    salesToday: {
      revenue:
        revenueToday,

      soldKg:
        soldKgToday,

      orderCount:
        salesToday._count
          ._all,
    },

    eggStock: {
      currentStockKg:
        eggStock.currentStockKg,

      isNegative:
        eggStock.isNegative,
    },

    estimatedProfitMonthToDate: {
      estimatedOperationalProfit:
        profitMonthToDate
          .estimatedOperationalProfit,

      operationalMarginPercent:
        profitMonthToDate
          .operationalMarginPercent,

      hppPerKg:
        profitMonthToDate.hpp
          .hppPerKg,

      status:
        profitMonthToDate.status,
    },

    activeEggPrice:
      activeEggPrice
        ? {
            pricePerKg:
              activeEggPrice
                .pricePerKg
                .toString(),

            effectiveAt:
              activeEggPrice
                .effectiveAt
                .toISOString()
                .slice(
                  0,
                  10,
                ),
          }
        : null,

    dataQuality: {
      completeReportsToday:
        completeReports,

      incompleteReportsToday:
        incompleteReports,

      notStartedReportsToday:
        notStartedReports,

      expectedReportsToday:
        expectedReports,

      profitStatus:
        profitMonthToDate.status,

      missingFeedCostReportsMonthToDate:
        profitMonthToDate.hpp
          .missingFeedCostReportCount,
    },
  };
}