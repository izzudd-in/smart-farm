import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/server/auth/guards";

import { productionReportSelect } from "@/features/production/queries/production-fields";
import type {
  ProductionKandangSummary,
  ProductionPageData,
  ProductionFilters,
  ProductionComparison,
} from "@/features/production/types/production";
import {
  buildProductionTrend,
  buildTrendComparison,
  calculateDamagedPercentage,
  calculateEstimatedPopulation,
  calculateFcr,
  calculateHenDay,
  calculatePercentageChange,
  getPreviousPeriod,
  sumNullable,
} from "@/features/production/utils/calculations";
import { mapProductionReport } from "@/features/production/utils/map-production-report";
import { parseDateOnly } from "@/features/daily-operations/utils/date";

export async function getProductionPageData(
  filters: ProductionFilters,
): Promise<ProductionPageData> {
  await requireRole([UserRole.OWNER, UserRole.OPERATOR]);

  const fromDate = parseDateOnly(filters.from);
  const toDate = parseDateOnly(filters.to);

  // 1. Calculate previous period
  const mode = filters.mode ?? "weekly";
  const previousPeriod = getPreviousPeriod(filters.from, filters.to, mode);
  const prevFromDate = parseDateOnly(previousPeriod.from);
  const prevToDate = parseDateOnly(previousPeriod.to);

  const kandangWhere = {
    farm: {
      scope: "PRIMARY",
    },
    ...(filters.kandangId
      ? {
          id: filters.kandangId,
        }
      : {}),
  };

  // 2. Fetch kandang options & selected kandangs with relevant flocks
  const [kandangOptions, kandangs] = await Promise.all([
    prisma.kandang.findMany({
      where: {
        farm: {
          scope: "PRIMARY",
        },
      },
      orderBy: {
        code: "asc",
      },
      select: {
        id: true,
        code: true,
        name: true,
      },
    }),

    prisma.kandang.findMany({
      where: kandangWhere,
      orderBy: {
        code: "asc",
      },
      select: {
        id: true,
        code: true,
        name: true,
        flocks: {
          where: {
            startDate: {
              lte: toDate,
            },
            OR: [
              {
                endedAt: null,
              },
              {
                endedAt: {
                  gte: prevFromDate, // include flocks active in either period
                },
              },
            ],
          },
          orderBy: {
            startDate: "desc",
          },
          select: {
            id: true,
            name: true,
            startDate: true,
            endedAt: true,
            initialPopulation: true,
          },
        },
      },
    }),
  ]);

  const kandangIds = kandangs.map((k) => k.id);

  // 3. Fetch active period and previous period daily reports in parallel
  const [reportRecords, prevReportRecords] = await Promise.all([
    kandangIds.length > 0
      ? prisma.dailyReport.findMany({
          where: {
            kandangId: {
              in: kandangIds,
            },
            date: {
              gte: fromDate,
              lte: toDate,
            },
          },
          orderBy: {
            date: "asc",
          },
          select: productionReportSelect,
        })
      : [],

    kandangIds.length > 0
      ? prisma.dailyReport.findMany({
          where: {
            kandangId: {
              in: kandangIds,
            },
            date: {
              gte: prevFromDate,
              lte: prevToDate,
            },
          },
          orderBy: {
            date: "asc",
          },
          select: productionReportSelect,
        })
      : [],
  ]);

  const rawHistory = reportRecords.map(mapProductionReport);
  const rawPrevHistory = prevReportRecords.map(mapProductionReport);

  // 4. Batch query cumulative mortality for active flocks up to toDate
  const allFlockIds = Array.from(
    new Set([
      ...kandangs.flatMap((k) => k.flocks.map((f) => f.id)),
      ...rawHistory.map((r) => r.flockId),
      ...rawPrevHistory.map((r) => r.flockId),
    ]),
  );

  const [mortalityGroups, prevMortalityGroups] = await Promise.all([
    allFlockIds.length > 0
      ? prisma.dailyReport.groupBy({
          by: ["flockId"],
          where: {
            flockId: {
              in: allFlockIds,
            },
            date: {
              lte: toDate,
            },
            mortality: {
              not: null,
            },
          },
          _sum: {
            mortality: true,
          },
        })
      : [],

    allFlockIds.length > 0
      ? prisma.dailyReport.groupBy({
          by: ["flockId"],
          where: {
            flockId: {
              in: allFlockIds,
            },
            date: {
              lte: prevToDate,
            },
            mortality: {
              not: null,
            },
          },
          _sum: {
            mortality: true,
          },
        })
      : [],
  ]);

  const mortalityByFlock = new Map(
    mortalityGroups.map((group) => [
      group.flockId,
      group._sum.mortality ?? 0,
    ]),
  );

  const prevMortalityByFlock = new Map(
    prevMortalityGroups.map((group) => [
      group.flockId,
      group._sum.mortality ?? 0,
    ]),
  );

  // 5. Build estimated population map for active history rows to calculate Hen-Day
  const history = rawHistory.map((row) => {
    const flockMortality = mortalityByFlock.get(row.flockId) ?? 0;
    const estimatedPopulation = calculateEstimatedPopulation(
      row.initialPopulation,
      flockMortality,
    );
    const henDay = calculateHenDay(row.totalEgg, estimatedPopulation, 1);

    return {
      ...row,
      estimatedPopulation,
      henDay,
    };
  });

  // 6. Summarize per-kandang metrics
  const kandangSummaries: ProductionKandangSummary[] = kandangs.map(
    (kandang) => {
      const rows = history.filter(
        (report) => report.kandangId === kandang.id,
      );

      const latestReport = [...rows].sort((a, b) =>
        b.date.localeCompare(a.date),
      )[0];

      const activeFlock =
        kandang.flocks.find(
          (f) => !f.endedAt || f.endedAt >= toDate,
        ) ?? kandang.flocks[0] ?? null;

      const displayedFlock =
        activeFlock ??
        (latestReport
          ? {
              id: latestReport.flockId,
              name: latestReport.flockName,
              initialPopulation: latestReport.initialPopulation,
              startDate: parseDateOnly(latestReport.flockStartDate),
              endedAt: null,
            }
          : null);

      const totalProduction = sumNullable(
        rows.map((report) => report.totalEgg),
      );

      const saleableEgg = sumNullable(
        rows.map((report) => report.saleableEgg),
      );

      const damagedEgg = sumNullable(
        rows.map((report) => report.damagedEgg),
      );

      const feedUsed = sumNullable(
        rows.map((report) => report.feedUsed),
      );

      const fcr = calculateFcr(feedUsed, totalProduction);

      const cumulativeMortality = displayedFlock
        ? mortalityByFlock.get(displayedFlock.id) ?? 0
        : null;

      const estimatedPopulation = displayedFlock
        ? calculateEstimatedPopulation(
            displayedFlock.initialPopulation,
            cumulativeMortality ?? 0,
          )
        : null;

      const henDay = calculateHenDay(
        totalProduction,
        estimatedPopulation,
        previousPeriod.daysCount,
      );

      const mortalityInPeriod = sumNullable(
        rows.map((report) => report.mortality),
      );

      const endDateReport = rows.find(
        (report) => report.date === filters.to,
      );

      return {
        kandangId: kandang.id,
        kandangCode: kandang.code,
        kandangName: kandang.name,

        flockId: displayedFlock?.id ?? null,
        flockName: displayedFlock?.name ?? null,

        reportCount: rows.length,

        totalProduction,
        saleableEgg,
        damagedEgg,
        damagedPercentage: calculateDamagedPercentage(
          saleableEgg,
          damagedEgg,
        ),

        feedUsed,
        fcr,
        henDay,

        cumulativeMortality,
        estimatedPopulation,
        mortalityInPeriod,
        mortalityOnEndDate: endDateReport?.mortality ?? null,
      };
    },
  );

  const activePopulations = kandangSummaries
    .map((k) => k.estimatedPopulation)
    .filter((population): population is number => population !== null);

  const activePopulation =
    activePopulations.length === 0
      ? null
      : activePopulations.reduce((total, value) => total + value, 0);

  const totalProduction = sumNullable(
    history.map((report) => report.totalEgg),
  );

  const saleableEgg = sumNullable(
    history.map((report) => report.saleableEgg),
  );

  const damagedEgg = sumNullable(
    history.map((report) => report.damagedEgg),
  );

  const feedUsed = sumNullable(
    history.map((report) => report.feedUsed),
  );

  const fcr = calculateFcr(feedUsed, totalProduction);
  const henDay = calculateHenDay(
    totalProduction,
    activePopulation,
    previousPeriod.daysCount,
  );

  const totalMortality = sumNullable(
    history.map((report) => report.mortality),
  );

  // 7. Calculate Previous Period KPIs for Comparison
  const prevTotalProduction = sumNullable(
    rawPrevHistory.map((report) => report.totalEgg),
  );

  const prevSaleableEgg = sumNullable(
    rawPrevHistory.map((report) => report.saleableEgg),
  );

  const prevDamagedEgg = sumNullable(
    rawPrevHistory.map((report) => report.damagedEgg),
  );

  const prevFeedUsed = sumNullable(
    rawPrevHistory.map((report) => report.feedUsed),
  );

  const prevTotalMortality = sumNullable(
    rawPrevHistory.map((report) => report.mortality),
  );

  const prevFcr = calculateFcr(prevFeedUsed, prevTotalProduction);

  // Approximate previous active population using prev mortality
  const prevActivePopulations = kandangs
    .map((kandang) => {
      const activeFlock = kandang.flocks[0];
      if (!activeFlock) return null;
      const mort = prevMortalityByFlock.get(activeFlock.id) ?? 0;
      return calculateEstimatedPopulation(activeFlock.initialPopulation, mort);
    })
    .filter((p): p is number => p !== null);

  const prevActivePopulation =
    prevActivePopulations.length === 0
      ? activePopulation
      : prevActivePopulations.reduce((total, value) => total + value, 0);

  const prevHenDay = calculateHenDay(
    prevTotalProduction,
    prevActivePopulation,
    previousPeriod.daysCount,
  );

  const previousKpis = {
    totalProduction: prevTotalProduction,
    saleableEgg: prevSaleableEgg,
    damagedEgg: prevDamagedEgg,
    damagedPercentage: calculateDamagedPercentage(
      prevSaleableEgg,
      prevDamagedEgg,
    ),
    feedUsed: prevFeedUsed,
    fcr: prevFcr,
    henDay: prevHenDay,
    activePopulation: prevActivePopulation,
    totalMortality: prevTotalMortality,
  };

  // 8. Percentage changes: ((current - previous) / previous) * 100%
  const changes = {
    totalProduction: calculatePercentageChange(
      totalProduction,
      prevTotalProduction,
    ),
    saleableEgg: calculatePercentageChange(
      saleableEgg,
      prevSaleableEgg,
    ),
    damagedEgg: calculatePercentageChange(
      damagedEgg,
      prevDamagedEgg,
    ),
    feedUsed: calculatePercentageChange(
      feedUsed,
      prevFeedUsed,
    ),
    fcr: calculatePercentageChange(
      fcr,
      prevFcr,
    ),
    henDay: calculatePercentageChange(
      henDay,
      prevHenDay,
    ),
    totalMortality: calculatePercentageChange(
      totalMortality,
      prevTotalMortality,
    ),
  };

  // 9. Generate trendComparison aligned with the selected mode (today, weekly, monthly, custom)
  const trendComparison = buildTrendComparison({
    mode,
    fromDate,
    toDate,
    prevFromDate,
    prevToDate,
    currentHistory: history,
    previousHistory: rawPrevHistory,
  });

  const comparison: ProductionComparison = {
    mode,
    previousPeriod: {
      from: previousPeriod.from,
      to: previousPeriod.to,
    },
    previousKpis,
    changes,
    trendComparison,
  };

  return {
    filters,
    kandangOptions,

    kpis: {
      totalProduction,
      saleableEgg,
      damagedEgg,
      damagedPercentage: calculateDamagedPercentage(
        saleableEgg,
        damagedEgg,
      ),
      feedUsed,
      fcr,
      henDay,
      activePopulation,
      totalMortality,
    },

    trend: buildProductionTrend(history),
    kandangs: kandangSummaries,

    history: [...history].sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        a.kandangCode.localeCompare(b.kandangCode),
    ),

    comparison,
  };
}