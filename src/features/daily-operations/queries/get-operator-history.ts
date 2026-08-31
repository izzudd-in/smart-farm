import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { requirePageRole } from "@/server/auth/guards";

import { dailyReportViewSelect } from "@/features/daily-operations/queries/report-fields";
import type { DailyReportView } from "@/features/daily-operations/types/daily-report";
import { mapDailyReportView } from "@/features/daily-operations/utils/map-report";

export async function getOperatorHistory(): Promise<
  DailyReportView[]
> {
  const user = await requirePageRole(
    UserRole.OPERATOR,
  );

  const reports =
    await prisma.dailyReport.findMany({
      where: {
        operatorId: user.id,
      },

      orderBy: [
        {
          date: "desc",
        },
        {
          updatedAt: "desc",
        },
      ],

      take: 30,

      select:
        dailyReportViewSelect,
    });

  return reports.map(
    mapDailyReportView,
  );
}