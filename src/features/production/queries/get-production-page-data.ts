import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/server/auth/guards";

import { productionReportSelect } from "@/features/production/queries/production-fields";
import type {
  ProductionKandangSummary,
  ProductionPageData,
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

export async function getProductionPageData(
  filters: ProductionFilters,
): Promise<ProductionPageData> {
  await requireRole(UserRole.OWNER);

  const fromDate =
    parseDateOnly(filters.from);

  const toDate =
    parseDateOnly(filters.to);

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

  const [
    kandangOptions,
    kandangs,
    reportRecords,
  ] = await Promise.all([
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
                  gte: toDate,
                },
              },
            ],
          },

          orderBy: {
            startDate: "desc",
          },

          take: 1,

          select: {
            id: true,
            name: true,
            startDate: true,
            initialPopulation: true,
          },
        },
      },
    }),

    prisma.dailyReport.findMany({
      where: {
        date: {
          gte: fromDate,
          lte: toDate,
        },

        kandang: kandangWhere,
      },

      orderBy: {
        date: "asc",
      },

      select:
        productionReportSelect,
    }),
  ]);

  const history =
    reportRecords.map(
      mapProductionReport,
    );

  const flockIds =
    kandangs.flatMap(
      (kandang) =>
        kandang.flocks[0]
          ? [
              kandang.flocks[0]
                .id,
            ]
          : [],
    );

  const mortalityGroups =
    flockIds.length > 0
      ? await prisma.dailyReport.groupBy(
          {
            by: ["flockId"],

            where: {
              flockId: {
                in: flockIds,
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
          },
        )
      : [];

  const mortalityByFlock =
    new Map(
      mortalityGroups.map(
        (group) => [
          group.flockId,
          group._sum.mortality ??
            0,
        ],
      ),
    );

  const kandangSummaries: ProductionKandangSummary[] =
    kandangs.map(
      (kandang) => {
        const rows =
          history.filter(
            (report) =>
              report.kandangId ===
              kandang.id,
          );

        const asOfFlock =
          kandang.flocks[0] ??
          null;

        const saleableEgg =
          sumNullable(
            rows.map(
              (report) =>
                report.saleableEgg,
            ),
          );

        const damagedEgg =
          sumNullable(
            rows.map(
              (report) =>
                report.damagedEgg,
            ),
          );

        const totalProduction =
          sumNullable(
            rows.map(
              (report) =>
                report.totalEgg,
            ),
          );

        const latestReport =
          [...rows].sort(
            (a, b) =>
              b.date.localeCompare(
                a.date,
              ),
          )[0];

        const displayedFlock =
          asOfFlock ??
          (latestReport
            ? {
                id:
                  latestReport.flockId,
                name:
                  latestReport.flockName,

                initialPopulation:
                  latestReport.initialPopulation,

                startDate:
                  parseDateOnly(
                    latestReport.flockStartDate,
                  ),
              }
            : null);

        const cumulativeMortality =
          asOfFlock
            ? mortalityByFlock.get(
                asOfFlock.id,
              ) ?? 0
            : null;

        const estimatedPopulation =
          asOfFlock
            ? calculateEstimatedPopulation(
                asOfFlock.initialPopulation,
                cumulativeMortality ??
                  0,
              )
            : null;

        const endDateReport =
          rows.find(
            (report) =>
              report.date ===
              filters.to,
          );

        return {
          kandangId:
            kandang.id,

          kandangCode:
            kandang.code,

          kandangName:
            kandang.name,

          flockId:
            displayedFlock?.id ??
            null,

          flockName:
            displayedFlock?.name ??
            null,

          reportCount:
            rows.length,

          totalProduction,

          saleableEgg,

          damagedEgg,

          damagedPercentage:
            calculateDamagedPercentage(
              saleableEgg,
              damagedEgg,
            ),

          cumulativeMortality,

          estimatedPopulation,

          mortalityOnEndDate:
            endDateReport
              ?.mortality ?? null,
        };
      },
    );

  const activePopulations =
    kandangSummaries
      .map(
        (kandang) =>
          kandang.estimatedPopulation,
      )
      .filter(
        (
          population,
        ): population is number =>
          population !== null,
      );

  return {
    filters,

    kandangOptions,

    kpis: {
      totalProduction:
        sumNullable(
          history.map(
            (report) =>
              report.totalEgg,
          ),
        ),

      saleableEgg:
        sumNullable(
          history.map(
            (report) =>
              report.saleableEgg,
          ),
        ),

      damagedEgg:
        sumNullable(
          history.map(
            (report) =>
              report.damagedEgg,
          ),
        ),

      activePopulation:
        activePopulations.length ===
        0
          ? null
          : activePopulations.reduce(
              (total, value) =>
                total + value,
              0,
            ),
    },

    trend:
      buildProductionTrend(
        history,
      ),

    kandangs:
      kandangSummaries,

    history: [...history].sort(
      (a, b) =>
        b.date.localeCompare(
          a.date,
        ) ||
        a.kandangCode.localeCompare(
          b.kandangCode,
        ),
    ),
  };
}