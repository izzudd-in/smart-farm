import { Badge } from "@/components/ui/badge";

import type {
  DailyReportStatus,
} from "@/features/daily-operations/types/daily-report";
import {
  getDailyReportStatusLabel,
} from "@/features/daily-operations/utils/status";

type ReportStatusBadgeProps = {
  status: DailyReportStatus;
};

export function ReportStatusBadge({
  status,
}: ReportStatusBadgeProps) {
  if (status === "COMPLETE") {
    return (
      <Badge variant="success">
        {getDailyReportStatusLabel(
          status,
        )}
      </Badge>
    );
  }

  if (status === "INCOMPLETE") {
    return (
      <Badge variant="warning">
        {getDailyReportStatusLabel(
          status,
        )}
      </Badge>
    );
  }

  return (
    <Badge variant="neutral">
      {getDailyReportStatusLabel(
        status,
      )}
    </Badge>
  );
}