import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { requirePageRole } from "@/server/auth/guards";

import { dailyReportViewSelect } from "@/features/daily-operations/queries/report-fields";
import type { DailyReportView } from "@/features/daily-operations/types/daily-report";
import { mapDailyReportView } from "@/features/daily-operations/utils/map-report";

export async function getOperatorReportDetail(
  reportId: string,
): Promise<DailyReportView | null> {
  const user = await requirePageRole(UserRole.OPERATOR);

  const report =
    await prisma.dailyReport.findFirst({
      where: {
        id: reportId,

        OR: [
          {
            operatorId: user.id,
          },
          {
            kandang: {
              operators: {
                some: {
                  id: user.id,
                },
              },
            },
          },
        ],
      },

      select:
        dailyReportViewSelect,
    });

  return report
    ? mapDailyReportView(report)
    : null;
}