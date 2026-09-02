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
  parseDateOnly,
} from "@/features/daily-operations/utils/date";

import {
  calculateRoutineCostAllocationForPeriod,
  centsToMoney,
  moneyToCents,
  sumMoney,
} from "@/features/expenses/utils/routine-cost-allocation";

import {
  calculateDailyReportFeedCost,
} from "@/features/feed/utils/feed-cost";

import type {
  DailyHppBreakdown,
  HppPeriodResult,
  HppStatus,
} from "@/features/finance/types/hpp";

import {
  addMoney,
  calculateHppPerKg,
  enumerateDateStrings,
} from "@/features/finance/utils/hpp-calculation";

import {
  milliKgToQuantity,
  quantityToMilliKg,
} from "@/features/inventory/utils/quantity";

type DayAccumulator = {
  productionMilliKg: bigint;

  feedCostCents: bigint;

  missingFeedCostReportCount: number;
  incompleteReportCount: number;

  ownerExpenseCents: bigint;
  operationExpenseCents: bigint;
};

function createDayAccumulator(): DayAccumulator {
  return {
    productionMilliKg:
      BigInt(0),

    feedCostCents:
      BigInt(0),

    missingFeedCostReportCount:
      0,

    incompleteReportCount:
      0,

    ownerExpenseCents:
      BigInt(0),

    operationExpenseCents:
      BigInt(0),
  };
}

function getStatus(
  input: {
    productionMilliKg: bigint;
    missingFeedCostReportCount: number;
    incompleteReportCount: number;
  },
): HppStatus {
  if (
    input.missingFeedCostReportCount >
    0
  ) {
    return "MISSING_FEED_COST";
  }

  if (
    input.productionMilliKg <=
    BigInt(0)
  ) {
    return "NO_PRODUCTION";
  }

  if (
    input.incompleteReportCount >
    0
  ) {
    return "PROVISIONAL";
  }

  return "READY";
}

function getWarnings(
  input: {
    status: HppStatus;
    incompleteReportCount: number;
    missingFeedCostReportCount: number;
  },
): string[] {
  const warnings:
    string[] = [];

  if (
    input.missingFeedCostReportCount >
    0
  ) {
    warnings.push(
      `${input.missingFeedCostReportCount} laporan lengkap belum memiliki snapshot biaya pakan yang lengkap.`,
    );
  }

  if (
    input.incompleteReportCount >
    0
  ) {
    warnings.push(
      `${input.incompleteReportCount} laporan operasional masih belum lengkap. HPP periode ini dapat bersifat sementara.`,
    );
  }

  if (
    input.status ===
    "NO_PRODUCTION"
  ) {
    warnings.push(
      "Belum ada produksi telur jual pada periode ini.",
    );
  }

  return warnings;
}

export async function getHppForPeriod(
  from: Date,
  to: Date,
): Promise<HppPeriodResult> {
  await requireRole(
    UserRole.OWNER,
  );

  if (
    from > to
  ) {
    throw new Error(
      "Periode HPP tidak valid.",
    );
  }

  /*
   * Mengambil data secara batch paralel.
   * Tidak ada query per tanggal dan tidak ada pemanggilan
   * query agregasi redundan.
   */
  const [
    reports,
    routineCosts,
    ownerDailyExpenses,
  ] = await Promise.all([
    prisma.dailyReport.findMany({
      where: {
        date: {
          gte: from,
          lte: to,
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
        id:
          true,

        date:
          true,

        createdAt:
          true,

        saleableEgg:
          true,

        damagedEgg:
          true,

        feedUsed:
          true,

        mortality:
          true,

        incidentalExpense:
          true,

        feedItems: {
          select: {
            ingredientId:
              true,

            percentage:
              true,

            unitCostPerKgSnapshot:
              true,

            costBasisSnapshot:
              true,
          },
        },
      },
    }),

    prisma.routineCost.findMany({
      where: {
        farm: {
          scope:
            "PRIMARY",
        },

        periodStart: {
          lte: to,
        },

        periodEnd: {
          gte: from,
        },
      },

      select: {
        amount:
          true,

        periodStart:
          true,

        periodEnd:
          true,
      },
    }),

    prisma.dailyExpense.findMany({
      where: {
        farm: {
          scope:
            "PRIMARY",
        },

        occurredAt: {
          gte: from,
          lte: to,
        },
      },

      select: {
        occurredAt:
          true,

        amount:
          true,
      },
    }),
  ]);

  const dateStrings =
    enumerateDateStrings(
      from,
      to,
    );

  const days =
    new Map<
      string,
      DayAccumulator
    >(
      dateStrings.map(
        (
          date,
        ) => [
          date,
          createDayAccumulator(),
        ],
      ),
    );

  let productionMilliKg =
    BigInt(0);

  let knownFeedCostCents =
    BigInt(0);

  let totalOperationExpenseCents =
    BigInt(0);

  let totalOwnerExpenseCents =
    BigInt(0);

  let incompleteReportCount =
    0;

  let missingFeedCostReportCount =
    0;

  for (
    const report
    of reports
  ) {
    const date =
      report.date
        .toISOString()
        .slice(
          0,
          10,
        );

    const day =
      days.get(
        date,
      );

    if (!day) {
      continue;
    }

    /*
     * Incidental expense adalah fakta biaya
     * sendiri dan tetap masuk walaupun report
     * core masih INCOMPLETE.
     */
    if (
      report.incidentalExpense &&
      report.incidentalExpense.gt(
        0,
      )
    ) {
      const incidentalCents =
        moneyToCents(
          report.incidentalExpense.toString(),
        );

      totalOperationExpenseCents +=
        incidentalCents;

      day.operationExpenseCents +=
        incidentalCents;
    }

    const status =
      getDailyReportStatus(
        report,
      );

    if (
      status !==
      "COMPLETE"
    ) {
      incompleteReportCount +=
        1;

      day.incompleteReportCount +=
        1;

      continue;
    }

    const saleableEgg =
      report.saleableEgg ??
      0;

    const reportProductionMilliKg =
      quantityToMilliKg(
        saleableEgg,
      );

    productionMilliKg +=
      reportProductionMilliKg;

    day.productionMilliKg +=
      reportProductionMilliKg;

    const feedCostResult =
      calculateDailyReportFeedCost({
        feedUsedKg:
          report.feedUsed ??
          0,

        items:
          report.feedItems.map(
            (
              item,
            ) => ({
              ingredientId:
                item.ingredientId,

              percentage:
                item.percentage.toString(),

              unitCostPerKgSnapshot:
                item.unitCostPerKgSnapshot
                  ?.toString() ??
                null,

              costBasisSnapshot:
                item.costBasisSnapshot,
            }),
          ),
      });

    if (
      !feedCostResult.isComplete
    ) {
      missingFeedCostReportCount +=
        1;

      day.missingFeedCostReportCount +=
        1;

      continue;
    }

    const reportFeedCost =
      feedCostResult.totalCost ??
      "0.00";

    const reportFeedCostCents =
      moneyToCents(
        reportFeedCost,
      );

    knownFeedCostCents +=
      reportFeedCostCents;

    day.feedCostCents +=
      reportFeedCostCents;
  }

  for (
    const expense
    of ownerDailyExpenses
  ) {
    const date =
      expense.occurredAt
        .toISOString()
        .slice(
          0,
          10,
        );

    const day =
      days.get(
        date,
      );

    if (!day) {
      continue;
    }

    const ownerCents =
      moneyToCents(
        expense.amount.toString(),
      );

    totalOwnerExpenseCents +=
      ownerCents;

    day.ownerExpenseCents +=
      ownerCents;
  }

  const routineCost =
    sumMoney(
      routineCosts.map(
        (
          cost,
        ) =>
          calculateRoutineCostAllocationForPeriod(
            {
              amount:
                cost.amount.toString(),

              periodStart:
                cost.periodStart,

              periodEnd:
                cost.periodEnd,

              from,

              to,
            },
          ),
      ),
    );

  const dailyExpenseCost =
    centsToMoney(
      totalOwnerExpenseCents +
        totalOperationExpenseCents,
    );

  const daily:
    DailyHppBreakdown[] =
      dateStrings
        .map(
          (
            date,
          ): DailyHppBreakdown => {
            const day =
              days.get(
                date,
              ) ??
              createDayAccumulator();

            const currentDate =
              parseDateOnly(
                date,
              );

            /*
             * Routine records sudah diambil batch.
             * Tidak ada query baru per tanggal.
             */
            const routineDailyCost =
              sumMoney(
                routineCosts.map(
                  (
                    cost,
                  ) =>
                    calculateRoutineCostAllocationForPeriod(
                      {
                        amount:
                          cost.amount.toString(),

                        periodStart:
                          cost.periodStart,

                        periodEnd:
                          cost.periodEnd,

                        from:
                          currentDate,

                        to:
                          currentDate,
                      },
                    ),
                ),
              );

            const ownerDailyCost =
              centsToMoney(
                day.ownerExpenseCents,
              );

            const operationDailyCost =
              centsToMoney(
                day.operationExpenseCents,
              );

            const dayDailyExpenseCost =
              addMoney(
                ownerDailyCost,
                operationDailyCost,
              );

            const status =
              getStatus({
                productionMilliKg:
                  day.productionMilliKg,

                missingFeedCostReportCount:
                  day.missingFeedCostReportCount,

                incompleteReportCount:
                  day.incompleteReportCount,
              });

            const productionKg =
              milliKgToQuantity(
                day.productionMilliKg,
              );

            const feedCost =
              day.missingFeedCostReportCount >
              0
                ? null
                : centsToMoney(
                    day.feedCostCents,
                  );

            const totalCost =
              feedCost ===
              null
                ? null
                : addMoney(
                    feedCost,
                    routineDailyCost,
                    dayDailyExpenseCost,
                  );

            const hppPerKg =
              totalCost ===
              null
                ? null
                : calculateHppPerKg(
                    totalCost,
                    productionKg,
                  );

            return {
              date,

              productionKg,

              feedCost,

              routineCost:
                routineDailyCost,

              dailyExpenseCost:
                dayDailyExpenseCost,

              totalCost,

              hppPerKg,

              status,

              warnings:
                getWarnings({
                  status,

                  incompleteReportCount:
                    day.incompleteReportCount,

                  missingFeedCostReportCount:
                    day.missingFeedCostReportCount,
                }),
            };
          },
        )
        .reverse();

  const periodStatus =
    getStatus({
      productionMilliKg,

      missingFeedCostReportCount,

      incompleteReportCount,
    });

  /*
   * Jika ada missing historical feed snapshot,
   * feed cost total sengaja null.
   *
   * knownFeedCostCents tidak ditampilkan sebagai
   * "total" karena itu akan menyesatkan.
   */
  const feedCost =
    missingFeedCostReportCount >
    0
      ? null
      : centsToMoney(
          knownFeedCostCents,
        );

  const productionKg =
    milliKgToQuantity(
      productionMilliKg,
    );

  const totalOperationalCost =
    feedCost === null
      ? null
      : addMoney(
          feedCost,
          routineCost,
          dailyExpenseCost,
        );

  const hppPerKg =
    totalOperationalCost ===
    null
      ? null
      : calculateHppPerKg(
          totalOperationalCost,
          productionKg,
        );

  return {
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

    productionKg,

    feedCost,

    routineCost,

    dailyExpenseCost,

    totalOperationalCost,

    hppPerKg,

    status:
      periodStatus,

    warnings:
      getWarnings({
        status:
          periodStatus,

        incompleteReportCount,

        missingFeedCostReportCount,
      }),

    incompleteReportCount,

    missingFeedCostReportCount,

    daily,
  };
}