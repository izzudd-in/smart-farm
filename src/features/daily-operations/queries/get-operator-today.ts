import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/server/auth/guards";

import { dailyReportViewSelect } from "@/features/daily-operations/queries/report-fields";
import type {
  DailyReportFeedItemView,
  OperatorTodayData,
} from "@/features/daily-operations/types/daily-report";
import {
  getJakartaTodayDate,
  getJakartaTodayString,
} from "@/features/daily-operations/utils/date";
import { mapDailyReportView } from "@/features/daily-operations/utils/map-report";
import { getDailyReportStatus } from "@/features/daily-operations/utils/status";
import {
  assertFormulaComplete,
  percentageToBasisPoints,
} from "@/features/feed/schemas/feed";

export async function getOperatorTodayData(): Promise<OperatorTodayData> {
  const user = await requireRole(
    UserRole.OPERATOR,
  );

  const dateString =
    getJakartaTodayString();

  const date =
    getJakartaTodayDate();

  const [
    kandangs,
    activeFormula,
  ] = await Promise.all([
    prisma.kandang.findMany({
      where: {
        isActive: true,

        operators: {
          some: {
            id: user.id,
          },
        },

        activeFlock: {
          isNot: null,
        },
      },

      orderBy: {
        code: "asc",
      },

      select: {
        id: true,
        code: true,
        name: true,

        activeFlock: {
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

    prisma.feedFormula.findFirst({
      where: {
        isActive: true,

        farm: {
          scope: "PRIMARY",
        },
      },

      select: {
        id: true,
        name: true,

        items: {
          orderBy: {
            ingredient: {
              name: "asc",
            },
          },

          select: {
            percentage: true,

            ingredient: {
              select: {
                id: true,
                name: true,
                isActive: true,
              },
            },
          },
        },
      },
    }),
  ]);

  let activeFormulaItems:
    DailyReportFeedItemView[] = [];

  let activeFormulaValid =
    false;

  if (
    activeFormula &&
    activeFormula.items.length > 0 &&
    activeFormula.items.every(
      (item) =>
        item.ingredient.isActive,
    )
  ) {
    try {
      assertFormulaComplete(
        activeFormula.items.reduce(
          (total, item) =>
            total +
            percentageToBasisPoints(
              item.percentage.toString(),
            ),
          0,
        ),
      );

      activeFormulaItems =
        activeFormula.items.map(
          (item) => ({
            ingredientId:
              item.ingredient.id,

            ingredientName:
              item.ingredient.name,

            percentage:
              item.percentage.toString(),
          }),
        );

      activeFormulaValid = true;
    } catch {
      activeFormulaValid = false;
    }
  }

  return {
    date: dateString,
    operatorId: user.id,
    operatorName: user.name,

    kandangs: kandangs.flatMap(
      (kandang) => {
        if (!kandang.activeFlock) {
          return [];
        }

        const flockStart =
          kandang.activeFlock.startDate
            .toISOString()
            .slice(0, 10);

        if (
          flockStart > dateString
        ) {
          return [];
        }

        const reportRecord =
          kandang.dailyReports[0];

        const report =
          reportRecord
            ? mapDailyReportView(
                reportRecord,
              )
            : null;

        const flock = report
          ? {
              id: report.flockId,
              name: report.flockName,
              startDate:
                report.flockStartDate,
            }
          : {
              id:
                kandang.activeFlock.id,

              name:
                kandang.activeFlock.name,

              startDate: flockStart,
            };

        let isEditable = true;

        let readOnlyReason:
          string | null = null;

        if (
          report &&
          report.operatorId !== user.id
        ) {
          isEditable = false;

          readOnlyReason =
            `Laporan hari ini sudah diisi oleh ${report.operatorName}.`;
        } else if (
          report &&
          report.flockId !==
            kandang.activeFlock.id
        ) {
          isEditable = false;

          readOnlyReason =
            "Laporan hari ini terikat ke flock sebelumnya dan tidak dapat diubah.";
        }

        const hasSnapshot =
          Boolean(
            report &&
              report.feedItems.length >
                0,
          );

        const feed = hasSnapshot
          ? {
              formulaId:
                report?.feedFormulaId ??
                null,

              formulaName:
                report?.feedFormulaName ??
                null,

              items:
                report?.feedItems ?? [],

              source:
                "REPORT_SNAPSHOT" as const,
            }
          : activeFormula &&
              activeFormulaValid
            ? {
                formulaId:
                  activeFormula.id,

                formulaName:
                  activeFormula.name,

                items:
                  activeFormulaItems,

                source:
                  "ACTIVE_FORMULA" as const,
              }
            : {
                formulaId: null,
                formulaName: null,
                items: [],

                source:
                  "NONE" as const,
              };

        return [
          {
            id: kandang.id,
            code: kandang.code,
            name: kandang.name,

            flock,

            report,

            status:
              report?.status ??
              getDailyReportStatus(
                null,
              ),

            feed,

            isEditable,
            readOnlyReason,
          },
        ];
      },
    ),
  };
}