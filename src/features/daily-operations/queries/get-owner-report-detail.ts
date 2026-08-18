import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/server/auth/guards";

import { dailyReportViewSelect } from "@/features/daily-operations/queries/report-fields";
import type { DailyReportView } from "@/features/daily-operations/types/daily-report";
import { mapDailyReportView } from "@/features/daily-operations/utils/map-report";

export async function getOwnerReportDetail(
  reportId: string,
): Promise<DailyReportView | null> {
  await requireRole(UserRole.OWNER);

  const report =
    await prisma.dailyReport.findFirst({
      where: {
        id: reportId,

        kandang: {
          farm: {
            scope: "PRIMARY",
          },
        },
      },

      select:
        dailyReportViewSelect,
    });

  return report
    ? mapDailyReportView(report)
    : null;
}