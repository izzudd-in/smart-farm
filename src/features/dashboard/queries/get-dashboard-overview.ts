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
  getDailyReportStatus,
  isCoreReportComplete,
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
  milliKgToQuantity,
  quantityToMilliKg,
} from "@/features/inventory/utils/quantity";

import {
  getEggPriceForDate,
} from "@/features/sales/queries/get-egg-price-for-date";

import type {
  DashboardActivity,
  DashboardAlert,
  DashboardAlertSeverity,
  DashboardKandangToday,
  DashboardOverview,
  DashboardProductionTrendPoint,
} from "@/features/dashboard/types/dashboard";

const activityQuantityFormatter =
  new Intl.NumberFormat(
    "id-ID",
    {
      maximumFractionDigits:
        3,
    },
  );

const activityMoneyFormatter =
  new Intl.NumberFormat(
    "id-ID",
    {
      style:
        "currency",

      currency:
        "IDR",

      maximumFractionDigits:
        2,
    },
  );

const activityBusinessDateFormatter =
  new Intl.DateTimeFormat(
    "id-ID",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",

      timeZone:
        "UTC",
    },
  );

function addUtcDays(
  date: Date,
  days: number,
): Date {
  const result =
    new Date(
      date.getTime(),
    );

  result.setUTCDate(
    result.getUTCDate() +
      days,
  );

  return result;
}

function toDateOnly(
  date: Date,
): string {
  return date
    .toISOString()
    .slice(
      0,
      10,
    );
}

function normalizeQuantityKg(
  value:
    | string
    | number,
): string {
  return milliKgToQuantity(
    quantityToMilliKg(
      value,
    ),
  );
}

function formatActivityQuantity(
  value:
    | string
    | number,
): string {
  const normalized =
    normalizeQuantityKg(
      value,
    );

  const numeric =
    Number(
      normalized,
    );

  return Number.isFinite(
    numeric,
  )
    ? activityQuantityFormatter.format(
        numeric,
      )
    : normalized;
}

function formatActivityMoney(
  value: string,
): string {
  const numeric =
    Number(
      value,
    );

  return Number.isFinite(
    numeric,
  )
    ? activityMoneyFormatter.format(
        numeric,
      )
    : value;
}

function formatActivityBusinessDate(
  value: Date,
): string {
  return activityBusinessDateFormatter.format(
    value,
  );
}

function getAlertPriority(
  severity:
    DashboardAlertSeverity,
): number {
  switch (
    severity
  ) {
    case "CRITICAL":
      return 0;

    case "WARNING":
      return 1;

    default:
      return 2;
  }
}

function sortAlerts(
  alerts: DashboardAlert[],
): DashboardAlert[] {
  return alerts
    .sort(
      (
        left,
        right,
      ) => {
        const severityOrder =
          getAlertPriority(
            left.severity,
          ) -
          getAlertPriority(
            right.severity,
          );

        if (
          severityOrder !==
          0
        ) {
          return severityOrder;
        }

        return left.id.localeCompare(
          right.id,
        );
      },
    )
    .slice(
      0,
      6,
    );
}

function createProductionTrendDates(
  trendStart: Date,
): string[] {
  return Array.from(
    {
      length:
        7,
    },
    (
      _,
      index,
    ) =>
      toDateOnly(
        addUtcDays(
          trendStart,
          index,
        ),
      ),
  );
}

async function getRecentActivities(): Promise<
  DashboardActivity[]
> {
  /*
   * Hanya beberapa row terbaru per source.
   * Setelah itu merge + sort + top 6.
   *
   * Tidak ada Activity table.
   */
  const [
    dailyReports,
    orders,
    feedPurchases,
    dailyExpenses,
    eggAdjustments,
    feedAdjustments,
  ] = await Promise.all([
    prisma.dailyReport.findMany({
      where: {
        kandang: {
          farm: {
            scope:
              "PRIMARY",
          },
        },
      },

      orderBy: {
        updatedAt:
          "desc",
      },

      take:
        3,

      select: {
        id:
          true,

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

        updatedAt:
          true,

        kandang: {
          select: {
            name:
              true,
          },
        },
      },
    }),

    prisma.order.findMany({
      where: {
        farm: {
          scope:
            "PRIMARY",
        },
      },

      orderBy: {
        createdAt:
          "desc",
      },

      take:
        3,

      select: {
        id:
          true,

        orderedAt:
          true,

        customerNameSnapshot:
          true,

        quantityKg:
          true,

        createdAt:
          true,
      },
    }),

    prisma.feedPurchase.findMany({
      where: {
        farm: {
          scope:
            "PRIMARY",
        },
      },

      orderBy: {
        createdAt:
          "desc",
      },

      take:
        3,

      select: {
        id:
          true,

        purchasedAt:
          true,

        quantityKg:
          true,

        createdAt:
          true,

        ingredient: {
          select: {
            name:
              true,
          },
        },
      },
    }),

    prisma.dailyExpense.findMany({
      where: {
        farm: {
          scope:
            "PRIMARY",
        },
      },

      orderBy: {
        updatedAt:
          "desc",
      },

      take:
        3,

      select: {
        id:
          true,

        occurredAt:
          true,

        amount:
          true,

        description:
          true,

        updatedAt:
          true,
      },
    }),

    prisma.eggStockAdjustment.findMany({
      where: {
        farm: {
          scope:
            "PRIMARY",
        },
      },

      orderBy: {
        createdAt:
          "desc",
      },

      take:
        3,

      select: {
        id:
          true,

        occurredAt:
          true,

        type:
          true,

        quantityKg:
          true,

        note:
          true,

        createdAt:
          true,
      },
    }),

    prisma.feedStockAdjustment.findMany({
      where: {
        farm: {
          scope:
            "PRIMARY",
        },
      },

      orderBy: {
        createdAt:
          "desc",
      },

      take:
        3,

      select: {
        id:
          true,

        occurredAt:
          true,

        type:
          true,

        quantityKg:
          true,

        note:
          true,

        createdAt:
          true,

        ingredient: {
          select: {
            name:
              true,
          },
        },
      },
    }),
  ]);

  const activities:
    DashboardActivity[] = [];

  for (
    const report
    of dailyReports
  ) {
    const status =
      getDailyReportStatus(
        report,
      );

    activities.push({
      id:
        `daily-report:${report.id}`,

      type:
        "DAILY_REPORT",

      occurredAt:
        report.updatedAt.toISOString(),

      title:
        `Laporan ${report.kandang.name} diperbarui`,

      description:
        `${status === "COMPLETE" ? "Selesai" : "Belum lengkap"} · tanggal operasional ${formatActivityBusinessDate(
          report.date,
        )}`,

      href:
        `/daily?date=${toDateOnly(
          report.date,
        )}`,
    });
  }

  for (
    const order
    of orders
  ) {
    activities.push({
      id:
        `order:${order.id}`,

      type:
        "ORDER",

      occurredAt:
        order.createdAt.toISOString(),

      title:
        `Order ${formatActivityQuantity(
          order.quantityKg.toString(),
        )} kg untuk ${order.customerNameSnapshot}`,

      description:
        `Tanggal transaksi ${formatActivityBusinessDate(
          order.orderedAt,
        )}`,

      href:
        `/sales/orders/${order.id}`,
    });
  }

  for (
    const purchase
    of feedPurchases
  ) {
    activities.push({
      id:
        `feed-purchase:${purchase.id}`,

      type:
        "FEED_PURCHASE",

      occurredAt:
        purchase.createdAt.toISOString(),

      title:
        `Pembelian ${purchase.ingredient.name} ${formatActivityQuantity(
          purchase.quantityKg.toString(),
        )} kg`,

      description:
        `Tanggal pembelian ${formatActivityBusinessDate(
          purchase.purchasedAt,
        )}`,

      href:
        "/inventory?tab=feed",
    });
  }

  for (
    const expense
    of dailyExpenses
  ) {
    activities.push({
      id:
        `daily-expense:${expense.id}`,

      type:
        "DAILY_EXPENSE",

      occurredAt:
        expense.updatedAt.toISOString(),

      title:
        `Pengeluaran Owner ${formatActivityMoney(
          expense.amount.toString(),
        )}`,

      description:
        `${expense.description} · ${formatActivityBusinessDate(
          expense.occurredAt,
        )}`,

      href:
        "/expenses?tab=daily",
    });
  }

  for (
    const adjustment
    of eggAdjustments
  ) {
    const quantity =
      formatActivityQuantity(
        adjustment.quantityKg.toString(),
      );

    const title =
      adjustment.type ===
      "OPENING"
        ? `Stok awal telur ${quantity} kg`
        : adjustment.type ===
            "INCREASE"
          ? `Koreksi stok telur +${quantity} kg`
          : `Koreksi stok telur -${quantity} kg`;

    activities.push({
      id:
        `egg-adjustment:${adjustment.id}`,

      type:
        "EGG_STOCK_ADJUSTMENT",

      occurredAt:
        adjustment.createdAt.toISOString(),

      title,

      description:
        adjustment.note ??
        `Tanggal stok ${formatActivityBusinessDate(
          adjustment.occurredAt,
        )}`,

      href:
        "/inventory?tab=egg",
    });
  }

  for (
    const adjustment
    of feedAdjustments
  ) {
    const quantity =
      formatActivityQuantity(
        adjustment.quantityKg.toString(),
      );

    const prefix =
      adjustment.type ===
      "OPENING"
        ? ""
        : adjustment.type ===
            "INCREASE"
          ? "+"
          : "-";

    const action =
      adjustment.type ===
      "OPENING"
        ? "Stok awal"
        : adjustment.type ===
            "INCREASE"
          ? "Koreksi masuk"
          : "Koreksi keluar";

    activities.push({
      id:
        `feed-adjustment:${adjustment.id}`,

      type:
        "FEED_STOCK_ADJUSTMENT",

      occurredAt:
        adjustment.createdAt.toISOString(),

      title:
        `${action} ${adjustment.ingredient.name} ${prefix}${quantity} kg`,

      description:
        adjustment.note ??
        `Tanggal stok ${formatActivityBusinessDate(
          adjustment.occurredAt,
        )}`,

      href:
        "/inventory?tab=feed",
    });
  }

  return activities
    .sort(
      (
        left,
        right,
      ) => {
        const timestampOrder =
          right.occurredAt.localeCompare(
            left.occurredAt,
          );

        if (
          timestampOrder !==
          0
        ) {
          return timestampOrder;
        }

        return left.id.localeCompare(
          right.id,
        );
      },
    )
    .slice(
      0,
      6,
    );
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  await requireRole(
    UserRole.OWNER,
  );

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

  const trendStart =
    addUtcDays(
      today,
      -6,
    );

  const trendDates =
    createProductionTrendDates(
      trendStart,
    );

  /*
   * Today DailyReport hanya satu batch.
   *
   * PENTING:
   * reportsToday tidak difilter berdasarkan
   * status Kandang SAAT INI.
   *
   * Dengan demikian actual production hari ini
   * tetap historical fact dan konsisten dengan
   * module Production.
   *
   * Status Kandang hari ini tetap dibangun hanya
   * dari Kandang aktif + active flock.
   */
  const [
    operationalKandangs,
    reportsToday,
    trendReports,
    salesToday,
    eggStock,
    feedStock,
    profitMonthToDate,
    activeEggPrice,
    recentActivities,
  ] = await Promise.all([
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

      orderBy: {
        name:
          "asc",
      },

      select: {
        id:
          true,

        name:
          true,

        activeFlock: {
          select: {
            id:
              true,

            name:
              true,
          },
        },
      },
    }),

    prisma.dailyReport.findMany({
      where: {
        date:
          today,

        kandang: {
          farm: {
            scope:
              "PRIMARY",
          },
        },
      },

      select: {
        id:
          true,

        kandangId:
          true,

        flockId:
          true,

        saleableEgg:
          true,

        damagedEgg:
          true,

        feedUsed:
          true,

        mortality:
          true,

        operator: {
          select: {
            name:
              true,
          },
        },

        flock: {
          select: {
            name:
              true,
          },
        },
      },
    }),

    /*
     * Historical actual:
     * tidak bergantung Kandang.isActive sekarang.
     */
    prisma.dailyReport.findMany({
      where: {
        date: {
          gte:
            trendStart,

          lte:
            today,
        },

        kandang: {
          farm: {
            scope:
              "PRIMARY",
          },
        },
      },

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
      },
    }),

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

    getFeedStockAsOfDate(
      today,
    ),

    getProfitForPeriod(
      monthStart,
      today,
    ),

    getEggPriceForDate(
      today,
    ),

    getRecentActivities(),
  ]);

  /*
   * Production Today:
   * seluruh COMPLETE DailyReport PRIMARY hari ini.
   *
   * Ini sengaja terpisah dari current operational
   * Kandang status.
   */
  let productionMilliKg =
    BigInt(0);

  for (
    const report
    of reportsToday
  ) {
    if (
      !isCoreReportComplete(
        report,
      )
    ) {
      continue;
    }

    productionMilliKg +=
      quantityToMilliKg(
        report.saleableEgg ??
          0,
      );
  }

  const reportByKandangId =
    new Map(
      reportsToday.map(
        (
          report,
        ) => [
          report.kandangId,
          report,
        ],
      ),
    );

  let completeReports =
    0;

  let incompleteReports =
    0;

  const kandangs:
    DashboardKandangToday[] =
      operationalKandangs.map(
        (
          kandang,
        ) => {
          const candidate =
            reportByKandangId.get(
              kandang.id,
            );

          /*
           * Current-status report harus terkait
           * dengan active flock saat ini.
           *
           * Report dari flock lama tetap historical
           * fact untuk Production, tetapi tidak boleh
           * membuat active flock baru terlihat COMPLETE.
           */
          const report =
            candidate &&
            kandang.activeFlock &&
            candidate.flockId ===
              kandang.activeFlock.id
              ? candidate
              : undefined;

          const reportStatus =
            getDailyReportStatus(
              report ??
                null,
            );

          if (
            reportStatus ===
            "COMPLETE"
          ) {
            completeReports +=
              1;
          } else if (
            reportStatus ===
            "INCOMPLETE"
          ) {
            incompleteReports +=
              1;
          }

          return {
            kandangId:
              kandang.id,

            kandangName:
              kandang.name,

            flockName:
              kandang.activeFlock
                ?.name ??
              report?.flock.name ??
              "Flock aktif",

            reportStatus,

            operatorName:
              report
                ?.operator.name ??
              null,

            saleableEggKg:
              report?.saleableEgg ===
                null ||
              report?.saleableEgg ===
                undefined
                ? null
                : normalizeQuantityKg(
                    report.saleableEgg,
                  ),

            feedUsedKg:
              report?.feedUsed ===
                null ||
              report?.feedUsed ===
                undefined
                ? null
                : normalizeQuantityKg(
                    report.feedUsed,
                  ),

            mortality:
              report?.mortality ??
              null,

            reportId:
              report?.id ??
              null,
          };
        },
      );

  const expectedReports =
    kandangs.length;

  const notStartedReports =
    kandangs.filter(
      (
        kandang,
      ) =>
        kandang.reportStatus ===
        "NOT_STARTED",
    ).length;

  const trendAccumulator =
    new Map<
      string,
      {
        productionMilliKg: bigint;
        completeReportCount: number;
        incompleteReportCount: number;
      }
    >(
      trendDates.map(
        (
          date,
        ) => [
          date,
          {
            productionMilliKg:
              BigInt(0),

            completeReportCount:
              0,

            incompleteReportCount:
              0,
          },
        ],
      ),
    );

  for (
    const report
    of trendReports
  ) {
    const date =
      toDateOnly(
        report.date,
      );

    const day =
      trendAccumulator.get(
        date,
      );

    if (!day) {
      continue;
    }

    if (
      isCoreReportComplete(
        report,
      )
    ) {
      day.completeReportCount +=
        1;

      day.productionMilliKg +=
        quantityToMilliKg(
          report.saleableEgg ??
            0,
        );

      continue;
    }

    day.incompleteReportCount +=
      1;
  }

  const productionTrend:
    DashboardProductionTrendPoint[] =
      trendDates.map(
        (
          date,
        ) => {
          const day =
            trendAccumulator.get(
              date,
            );

          if (
            !day ||
            day.completeReportCount ===
              0
          ) {
            return {
              date,

              productionKg:
                null,

              completeReportCount:
                0,

              incompleteReportCount:
                day
                  ?.incompleteReportCount ??
                0,
            };
          }

          return {
            date,

            productionKg:
              milliKgToQuantity(
                day.productionMilliKg,
              ),

            completeReportCount:
              day.completeReportCount,

            incompleteReportCount:
              day.incompleteReportCount,
          };
        },
      );

  const alerts:
    DashboardAlert[] = [];

  if (
    eggStock.isNegative
  ) {
    alerts.push({
      id:
        "egg-stock-negative",

      severity:
        "CRITICAL",

      title:
        "Stok telur negatif",

      description:
        `Posisi stok telur saat ini ${formatActivityQuantity(
          eggStock.currentStockKg,
        )} kg.`,

      href:
        "/inventory?tab=egg",

      actionLabel:
        "Periksa stok",
    });
  }

  for (
    const ingredient
    of feedStock.ingredients
  ) {
    if (
      !ingredient.isNegative
    ) {
      continue;
    }

    alerts.push({
      id:
        `feed-stock-negative:${ingredient.ingredientId}`,

      severity:
        "CRITICAL",

      title:
        `Stok ${ingredient.ingredientName} negatif`,

      description:
        `Posisi stok ${ingredient.ingredientName} saat ini ${formatActivityQuantity(
          ingredient.currentStockKg,
        )} kg.`,

      href:
        "/inventory?tab=feed",

      actionLabel:
        "Periksa stok",
    });
  }

  const unfinishedKandangs =
    kandangs.filter(
      (
        kandang,
      ) =>
        kandang.reportStatus !==
        "COMPLETE",
    );

  if (
    unfinishedKandangs.length >
    0
  ) {
    const descriptionParts:
      string[] = [];

    if (
      notStartedReports >
      0
    ) {
      descriptionParts.push(
        `${notStartedReports} belum diisi`,
      );
    }

    if (
      incompleteReports >
      0
    ) {
      descriptionParts.push(
        `${incompleteReports} belum lengkap`,
      );
    }

    alerts.push({
      id:
        "operations-unfinished",

      severity:
        "WARNING",

      title:
        `${unfinishedKandangs.length} kandang belum menyelesaikan laporan hari ini`,

      description:
        descriptionParts.length >
        0
          ? descriptionParts.join(
              " · ",
            )
          : "Data operasional hari ini belum final.",

      href:
        `/daily?date=${todayString}`,

      actionLabel:
        "Lihat operasional",
    });
  }

  const missingFeedCostReports =
    profitMonthToDate.hpp
      .missingFeedCostReportCount;

  if (
    missingFeedCostReports >
    0
  ) {
    alerts.push({
      id:
        "missing-feed-cost",

      severity:
        "WARNING",

      title:
        "Biaya pakan historis belum lengkap",

      description:
        `${missingFeedCostReports} laporan COMPLETE bulan ini belum memiliki snapshot biaya pakan yang lengkap.`,

      href:
        "/hpp",

      actionLabel:
        "Periksa HPP",
    });
  } else if (
    profitMonthToDate.status ===
    "MISSING_COST"
  ) {
    /*
     * Generic missing-cost hanya digunakan bila
     * bukan missing Feed Cost yang sudah memiliki
     * alert sendiri.
     */
    alerts.push({
      id:
        "profit-missing-cost",

      severity:
        "WARNING",

      title:
        "Estimasi Profit belum dapat dihitung",

      description:
        "Source biaya bulan berjalan belum lengkap.",

      href:
        "/hpp",

      actionLabel:
        "Periksa HPP",
    });
  }

  if (
    !activeEggPrice
  ) {
    alerts.push({
      id:
        "no-active-egg-price",

      severity:
        "WARNING",

      title:
        "Belum ada harga telur aktif",

      description:
        "Belum ada Egg Price dengan tanggal efektif sampai hari ini.",

      href:
        "/sales",

      actionLabel:
        "Kelola harga",
    });
  }

  const revenueToday =
    salesToday._sum
      .totalPrice
      ?.toString() ??
    "0.00";

  const soldKgToday =
    normalizeQuantityKg(
      salesToday._sum
        .quantityKg
        ?.toString() ??
        "0",
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
        milliKgToQuantity(
          productionMilliKg,
        ),

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
              toDateOnly(
                activeEggPrice
                  .effectiveAt,
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
        missingFeedCostReports,
    },

    alerts:
      sortAlerts(
        alerts,
      ),

    kandangs,

    productionTrend,

    recentActivities,
  };
}