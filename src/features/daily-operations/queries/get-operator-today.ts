import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/server/auth/guards";

import { dailyReportViewSelect } from "@/features/daily-operations/queries/report-fields";
import type { OperatorTodayData } from "@/features/daily-operations/types/daily-report";
import {
  getJakartaTodayDate,
  getJakartaTodayString,
} from "@/features/daily-operations/utils/date";
import { mapDailyReportView } from "@/features/daily-operations/utils/map-report";
import { getDailyReportStatus } from "@/features/daily-operations/utils/status";

export async function getOperatorTodayData(): Promise<OperatorTodayData> {
  const user = await requireRole(
    UserRole.OPERATOR,
  );

  const dateString =
    getJakartaTodayString();

  const date =
    getJakartaTodayDate();

  const kandangs =
    await prisma.kandang.findMany({
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
    });

  return {
    date: dateString,
    operatorId: user.id,
    operatorName: user.name,

    kandangs: kandangs.flatMap(
      (kandang) => {
        if (!kandang.activeFlock) {
          return [];
        }

        const activeFlockStart =
          kandang.activeFlock.startDate
            .toISOString()
            .slice(0, 10);

        if (
          activeFlockStart >
          dateString
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
              id: kandang.activeFlock.id,
              name:
                kandang.activeFlock.name,
              startDate:
                activeFlockStart,
            };

        let isEditable = true;
        let readOnlyReason: string | null =
          null;

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

            isEditable,
            readOnlyReason,
          },
        ];
      },
    ),
  };
}