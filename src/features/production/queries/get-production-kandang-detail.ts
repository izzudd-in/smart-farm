import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/server/auth/guards";

import { productionReportSelect } from "@/features/production/queries/production-fields";
import type {
  ProductionKandangDetail,
  ProductionFilters,
} from "@/features/production/types/production";
import {
  buildProductionTrend,
  calculateDamagedPercentage,
  calculateEstimatedPopulation,
  sumNullable,
} from "@/features/production/utils/calculations";
import { mapProductionReport } from "@/features/production/utils/map-production-report";
import { parseDateOnly } from "@/features/daily-operations/utils/date";

export async function getProductionKandangDetail(
  kandangId: string,
  filters: ProductionFilters,
  requestedFlockId: string,
): Promise<ProductionKandangDetail | null> {
  await requireRole(UserRole.OWNER);

  const fromDate =
    parseDateOnly(filters.from);

  const toDate =
    parseDateOnly(filters.to);

  const kandang =
    await prisma.kandang.findFirst({
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

  const flockOptions =
    kandang.flocks.map(
      (flock) => ({
        id: flock.id,
        name: flock.name,

        startDate:
          flock.startDate
            .toISOString()
            .slice(0, 10),

        endedAt:
          flock.endedAt
            ?.toISOString()
            .slice(0, 10) ??
          null,

        initialPopulation:
          flock.initialPopulation,
      }),
    );

  const requestedFlock =
    kandang.flocks.find(
      (flock) =>
        flock.id ===
        requestedFlockId,
    );

  const latestFlockByDate =
    kandang.flocks.find(
      (flock) =>
        flock.startDate <=
        toDate,
    );

  const selectedFlock =
    requestedFlock ??
    latestFlockByDate ??
    null;

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
      },

      flockOptions,

      selectedFlock: null,

      totalProduction: null,
      saleableEgg: null,
      damagedEgg: null,
      damagedPercentage: null,

      cumulativeMortality: null,
      estimatedPopulation: null,

      trend: [],
      history: [],
    };
  }

  const [
    reportRecords,
    mortalityRecords,
  ] = await Promise.all([
    prisma.dailyReport.findMany({
      where: {
        kandangId:
          kandang.id,

        flockId:
          selectedFlock.id,

        date: {
          gte: fromDate,
          lte: toDate,
        },
      },

      orderBy: {
        date: "asc",
      },

      select:
        productionReportSelect,
    }),

    prisma.dailyReport.findMany({
      where: {
        flockId:
          selectedFlock.id,

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

  const mortalityAtDate =
    new Map<string, number>();

  for (const report of mortalityRecords) {
    runningMortality +=
      report.mortality ?? 0;

    mortalityAtDate.set(
      report.date
        .toISOString()
        .slice(0, 10),

      runningMortality,
    );
  }

  const history =
    reportRecords.map(
      (report) => {
        const mapped =
          mapProductionReport(
            report,
          );

        const cumulativeMortality =
          mortalityAtDate.get(
            mapped.date,
          ) ?? 0;

        return {
          ...mapped,

          cumulativeMortality,

          estimatedPopulation:
            calculateEstimatedPopulation(
              mapped.initialPopulation,
              cumulativeMortality,
            ),
        };
      },
    );

  const saleableEgg =
    sumNullable(
      history.map(
        (report) =>
          report.saleableEgg,
      ),
    );

  const damagedEgg =
    sumNullable(
      history.map(
        (report) =>
          report.damagedEgg,
      ),
    );

  const cumulativeMortality =
    mortalityRecords.reduce(
      (total, report) =>
        total +
        (report.mortality ??
          0),
      0,
    );

  return {
    kandang: {
      id: kandang.id,
      code: kandang.code,
      name: kandang.name,
    },

    filters: {
      from: filters.from,
      to: filters.to,
      flockId:
        selectedFlock.id,
    },

    flockOptions,

    selectedFlock: {
      id: selectedFlock.id,

      name:
        selectedFlock.name,

      startDate:
        selectedFlock.startDate
          .toISOString()
          .slice(0, 10),

      endedAt:
        selectedFlock.endedAt
          ?.toISOString()
          .slice(0, 10) ??
        null,

      initialPopulation:
        selectedFlock
          .initialPopulation,
    },

    totalProduction:
      sumNullable(
        history.map(
          (report) =>
            report.totalEgg,
        ),
      ),

    saleableEgg,

    damagedEgg,

    damagedPercentage:
      calculateDamagedPercentage(
        saleableEgg,
        damagedEgg,
      ),

    cumulativeMortality,

    estimatedPopulation:
      calculateEstimatedPopulation(
        selectedFlock
          .initialPopulation,

        cumulativeMortality,
      ),

    trend:
      buildProductionTrend(
        history,
      ),

    history:
      [...history].sort(
        (a, b) =>
          b.date.localeCompare(
            a.date,
          ),
      ),
  };
}