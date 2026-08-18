import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/server/auth/guards";

import { dailyReportViewSelect } from "@/features/daily-operations/queries/report-fields";
import type {
  OwnerDailyData,
  OwnerDailyFilters,
  OwnerDailyRow,
} from "@/features/daily-operations/types/daily-report";
import { parseDateOnly } from "@/features/daily-operations/utils/date";
import { mapDailyReportView } from "@/features/daily-operations/utils/map-report";
import { getDailyReportStatus } from "@/features/daily-operations/utils/status";

export async function getOwnerDailyData(
  filters: OwnerDailyFilters,
): Promise<OwnerDailyData> {
  await requireRole(UserRole.OWNER);

  const date =
    parseDateOnly(filters.date);

  const [
    kandangOptions,
    kandangs,
  ] = await Promise.all([
    prisma.kandang.findMany({
      where: {
        isActive: true,

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
      where: {
        isActive: true,

        farm: {
          scope: "PRIMARY",
        },

        ...(filters.kandangId
          ? {
              id: filters.kandangId,
            }
          : {}),
      },

      orderBy: {
        code: "asc",
      },

      select: {
        id: true,
        code: true,
        name: true,

        operators: {
          where: {
            role: UserRole.OPERATOR,
            isActive: true,
          },

          orderBy: {
            name: "asc",
          },

          select: {
            id: true,
            name: true,
          },
        },

        flocks: {
          where: {
            startDate: {
              lte: date,
            },

            OR: [
              {
                endedAt: null,
              },
              {
                endedAt: {
                  gte: date,
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
          },
        },

        dailyReports: {
          where: {
            date,
          },

          take: 1,

          select:
            dailyReportViewSelect,
        },
      },
    }),
  ]);

  const baseRows: OwnerDailyRow[] =
    kandangs.map((kandang) => {
      const reportRecord =
        kandang.dailyReports[0];

      const report =
        reportRecord
          ? mapDailyReportView(
              reportRecord,
            )
          : null;

      const historicalFlock =
        kandang.flocks[0];

      return {
        kandangId: kandang.id,
        kandangCode: kandang.code,
        kandangName: kandang.name,

        flockName:
          report?.flockName ??
          historicalFlock?.name ??
          null,

        operatorNames: report
          ? [report.operatorName]
          : kandang.operators.map(
              (operator) =>
                operator.name,
            ),

        report,

        status:
          report?.status ??
          getDailyReportStatus(null),
      };
    });

  const summary = {
    total: baseRows.length,

    complete:
      baseRows.filter(
        (row) =>
          row.status ===
          "COMPLETE",
      ).length,

    incomplete:
      baseRows.filter(
        (row) =>
          row.status ===
          "INCOMPLETE",
      ).length,

    notStarted:
      baseRows.filter(
        (row) =>
          row.status ===
          "NOT_STARTED",
      ).length,
  };

  const rows =
    filters.status === "ALL"
      ? baseRows
      : baseRows.filter(
          (row) =>
            row.status ===
            filters.status,
        );

  return {
    date: filters.date,
    filters,
    kandangOptions,
    rows,
    summary,
  };
}