import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/server/auth/guards";

import { productionReportSelect } from "@/features/production/queries/production-fields";
import type {
  ProductionKandangDetail,
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

export async function getProductionKandangDetail(
  kandangId: string,
  filters: ProductionFilters,
  requestedFlockId: string,
): Promise<ProductionKandangDetail | null> {
  await requireRole([UserRole.OWNER, UserRole.OPERATOR]);

  const fromDate = parseDateOnly(filters.from);
  const toDate = parseDateOnly(filters.to);

  const mode = filters.mode ?? "weekly";
  const previousPeriod = getPreviousPeriod(filters.from, filters.to, mode);
  const prevFromDate = parseDateOnly(previousPeriod.from);
  const prevToDate = parseDateOnly(previousPeriod.to);

  const kandang = await prisma.kandang.findFirst({
    where: {
      id: kandangId,
      farm: {
        scope: "PRIMARY",
      },
    },
    select: {
      id: true,
      code: true,
      name: true,
      flocks: {
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
  });

  if (!kandang) {
    return null;
  }

  const flockOptions = kandang.flocks.map((flock) => ({
    id: flock.id,
    name: flock.name,
    startDate: flock.startDate.toISOString().slice(0, 10),
    endedAt: flock.endedAt?.toISOString().slice(0, 10) ?? null,
    initialPopulation: flock.initialPopulation,
  }));

  const requestedFlock = kandang.flocks.find(
    (flock) => flock.id === requestedFlockId,
  );

  const latestFlockByDate = kandang.flocks.find(
    (flock) => flock.startDate <= toDate,
  );

  const selectedFlock =
    requestedFlock ??
    latestFlockByDate ??
    kandang.flocks[0] ??
    null;

  const emptyComparison: ProductionComparison = {
    mode,
    previousPeriod: {
      from: previousPeriod.from,
      to: previousPeriod.to,
    },
    previousKpis: {
      totalProduction: null,
      saleableEgg: null,
      damagedEgg: null,
      damagedPercentage: null,
      feedUsed: null,
      fcr: null,
      henDay: null,
      activePopulation: null,
      totalMortality: null,
    },
    changes: {
      totalProduction: null,
      saleableEgg: null,
      damagedEgg: null,
      feedUsed: null,
      fcr: null,
      henDay: null,
      totalMortality: null,
    },
    trendComparison: [],
  };

  if (!selectedFlock) {
    return {
      kandang: {
        id: kandang.id,
        code: kandang.code,
        name: kandang.name,
      },
      filters: {
        from: filters.from,
        to: filters.to,
        flockId: "",
        mode,
      },
      flockOptions,
      selectedFlock: null,
      totalProduction: null,
      saleableEgg: null,
      damagedEgg: null,
      damagedPercentage: null,
      feedUsed: null,
      fcr: null,
      henDay: null,
      totalMortalityInPeriod: null,
      cumulativeMortality: null,
      estimatedPopulation: null,
      trend: [],
      history: [],
      comparison: emptyComparison,
    };
  }

  // Fetch active period and previous period reports, and mortality history
  const [reportRecords, prevReportRecords, mortalityRecords] = await Promise.all([
    prisma.dailyReport.findMany({
      where: {
        kandangId: kandang.id,
        flockId: selectedFlock.id,
        date: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: {
        date: "asc",
      },
      select: productionReportSelect,
    }),

    prisma.dailyReport.findMany({
      where: {
        kandangId: kandang.id,
        flockId: selectedFlock.id,
        date: {
          gte: prevFromDate,
          lte: prevToDate,
        },
      },
      orderBy: {
        date: "asc",
      },
      select: productionReportSelect,
    }),

    prisma.dailyReport.findMany({
      where: {
        flockId: selectedFlock.id,
        date: {
          lte: toDate,
        },
      },
      orderBy: {
        date: "asc",
      },
      select: {
        date: true,
        mortality: true,
      },
    }),
  ]);

  let runningMortality = 0;
  const mortalityAtDate = new Map<string, number>();

  for (const report of mortalityRecords) {
    runningMortality += report.mortality ?? 0;
    mortalityAtDate.set(
      report.date.toISOString().slice(0, 10),
      runningMortality,
    );
  }

  const history = reportRecords.map((report) => {
    const mapped = mapProductionReport(report);
    const cumulativeMortality =
      mortalityAtDate.get(mapped.date) ?? 0;
    const estimatedPopulation = calculateEstimatedPopulation(
      mapped.initialPopulation,
      cumulativeMortality,
    );
    const henDay = calculateHenDay(mapped.totalEgg, estimatedPopulation, 1);

    return {
      ...mapped,
      cumulativeMortality,
      estimatedPopulation,
      henDay,
    };
  });

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

  const totalMortalityInPeriod = sumNullable(
    history.map((report) => report.mortality),
  );

  const cumulativeMortality = mortalityRecords.reduce(
    (total, report) => total + (report.mortality ?? 0),
    0,
  );

  const estimatedPopulation = calculateEstimatedPopulation(
    selectedFlock.initialPopulation,
    cumulativeMortality,
  );

  const henDay = calculateHenDay(
    totalProduction,
    estimatedPopulation,
    previousPeriod.daysCount,
  );

  // Previous Period Analysis
  const prevHistory = prevReportRecords.map(mapProductionReport);

  const prevTotalProduction = sumNullable(
    prevHistory.map((report) => report.totalEgg),
  );

  const prevSaleableEgg = sumNullable(
    prevHistory.map((report) => report.saleableEgg),
  );

  const prevDamagedEgg = sumNullable(
    prevHistory.map((report) => report.damagedEgg),
  );

  const prevFeedUsed = sumNullable(
    prevHistory.map((report) => report.feedUsed),
  );

  const prevTotalMortality = sumNullable(
    prevHistory.map((report) => report.mortality),
  );

  const prevFcr = calculateFcr(prevFeedUsed, prevTotalProduction);

  const prevMortalityAtEnd = mortalityAtDate.get(previousPeriod.to) ?? 0;
  const prevEstimatedPop = calculateEstimatedPopulation(
    selectedFlock.initialPopulation,
    prevMortalityAtEnd,
  );

  const prevHenDay = calculateHenDay(
    prevTotalProduction,
    prevEstimatedPop,
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
    activePopulation: prevEstimatedPop,
    totalMortality: prevTotalMortality,
  };

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
      totalMortalityInPeriod,
      prevTotalMortality,
    ),
  };

  const trendComparison = buildTrendComparison({
    mode,
    fromDate,
    toDate,
    prevFromDate,
    prevToDate,
    currentHistory: history,
    previousHistory: prevHistory,
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
    kandang: {
      id: kandang.id,
      code: kandang.code,
      name: kandang.name,
    },
    filters: {
      from: filters.from,
      to: filters.to,
      flockId: selectedFlock.id,
      mode,
    },
    flockOptions,
    selectedFlock: {
      id: selectedFlock.id,
      name: selectedFlock.name,
      startDate: selectedFlock.startDate.toISOString().slice(0, 10),
      endedAt: selectedFlock.endedAt?.toISOString().slice(0, 10) ?? null,
      initialPopulation: selectedFlock.initialPopulation,
    },
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
    totalMortalityInPeriod,
    cumulativeMortality,
    estimatedPopulation,
    trend: buildProductionTrend(history),
    history: [...history].sort((a, b) =>
      b.date.localeCompare(a.date),
    ),
    comparison,
  };
}