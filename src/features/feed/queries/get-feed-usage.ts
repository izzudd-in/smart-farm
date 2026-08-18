import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/server/auth/guards";

import type {
  FeedUsageData,
  FeedUsageFilters,
} from "@/features/feed/types/feed";
import { parseDateOnly } from "@/features/daily-operations/utils/date";

export async function getFeedUsage(
  filters: FeedUsageFilters,
): Promise<FeedUsageData> {
  await requireRole(UserRole.OWNER);

  const from =
    parseDateOnly(filters.from);

  const to =
    parseDateOnly(filters.to);

  const [
    kandangOptions,
    reports,
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

    prisma.dailyReport.findMany({
      where: {
        date: {
          gte: from,
          lte: to,
        },

        feedUsed: {
          not: null,
        },

        kandang: {
          farm: {
            scope: "PRIMARY",
          },

          ...(filters.kandangId
            ? {
                id: filters.kandangId,
              }
            : {}),
        },
      },

      orderBy: [
        {
          date: "desc",
        },
        {
          kandang: {
            code: "asc",
          },
        },
      ],

      select: {
        id: true,
        date: true,
        feedUsed: true,

        feedFormulaNameSnapshot:
          true,

        kandang: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },

        flock: {
          select: {
            name: true,
          },
        },

        feedItems: {
          orderBy: {
            ingredientNameSnapshot:
              "asc",
          },

          select: {
            ingredientId: true,
            ingredientNameSnapshot:
              true,
            percentage: true,
          },
        },
      },
    }),
  ]);

  const rows =
    reports.flatMap(
      (report) => {
        if (
          report.feedUsed === null
        ) {
          return [];
        }
        const feedUsed =
          report.feedUsed;

        return [
          {
            reportId:
              report.id,

            date:
              report.date
                .toISOString()
                .slice(0, 10),

            kandangId:
              report.kandang.id,

            kandangCode:
              report.kandang.code,

            kandangName:
              report.kandang.name,

            flockName:
              report.flock.name,

            feedUsed:
              feedUsed,

            formulaName:
              report.feedFormulaNameSnapshot,

            ingredients:
              report.feedItems.map(
                (item) => {
                  const percentage =
                    Number(
                      item.percentage,
                    );

                  return {
                    ingredientId:
                      item.ingredientId,

                    ingredientName:
                      item.ingredientNameSnapshot,

                    percentage,

                    quantityKg:
                      feedUsed *
                      (percentage /
                        100),
                  };
                },
              ),
          },
        ];
      },
    );

  const totalFeedUsed =
    rows.reduce(
      (total, row) =>
        total + row.feedUsed,
      0,
    );

  const usageDates =
    new Set(
      rows.map(
        (row) => row.date,
      ),
    );

  const formulaTotals =
    new Map<string, number>();

  for (const row of rows) {
    if (!row.formulaName) {
      continue;
    }

    formulaTotals.set(
      row.formulaName,

      (formulaTotals.get(
        row.formulaName,
      ) ?? 0) + row.feedUsed,
    );
  }

  const mostUsedFormula =
    Array.from(
      formulaTotals.entries(),
    ).sort(
      (a, b) =>
        b[1] - a[1],
    )[0]?.[0] ?? null;

  return {
    filters,

    kandangOptions,

    summary: {
      totalFeedUsed,

      averageDailyUsage:
        usageDates.size === 0
          ? 0
          : totalFeedUsed /
            usageDates.size,

      reportCount:
        rows.length,

      mostUsedFormula,
    },

    rows,
  };
}