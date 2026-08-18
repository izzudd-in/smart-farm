import Link from "next/link";
import {
  Bird,
  ChevronRight,
  Wheat,
} from "lucide-react";

import type {
  DailyReportView,
} from "@/features/daily-operations/types/daily-report";
import {
  formatReportDate,
} from "@/features/daily-operations/utils/date";
import { Card } from "@/components/ui/card";

import { ReportStatusBadge } from "./report-status-badge";

type OperatorHistoryListProps = {
  reports: DailyReportView[];
};

function displayNumber(
  value: number | null,
): string {
  return value === null
    ? "—"
    : new Intl.NumberFormat(
        "id-ID",
      ).format(value);
}

export function OperatorHistoryList({
  reports,
}: OperatorHistoryListProps) {
  if (reports.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="font-medium text-foreground">
          Belum ada riwayat laporan.
        </p>

        <p className="mt-1 text-sm text-muted">
          Laporan yang Anda simpan akan
          muncul di sini.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <Link
          key={report.id}
          href={`/operator/history/${report.id}`}
          className="block"
        >
          <Card className="p-4 transition-colors hover:bg-[#F9FAFB]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-foreground">
                  {report.kandangCode} ·{" "}
                  {report.kandangName}
                </p>

                <p className="mt-1 text-xs text-muted">
                  {formatReportDate(
                    report.date,
                  )}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <ReportStatusBadge
                  status={report.status}
                />

                <ChevronRight className="h-4 w-4 text-muted-light" />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3">
              <div>
                <div className="flex items-center gap-1 text-[11px] text-muted">
                  <Bird className="h-3.5 w-3.5" />
                  Telur Jual
                </div>

                <p className="mt-1 text-sm font-medium text-foreground">
                  {displayNumber(
                    report.saleableEgg,
                  )}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-1 text-[11px] text-muted">
                  <Wheat className="h-3.5 w-3.5" />
                  Pakan
                </div>

                <p className="mt-1 text-sm font-medium text-foreground">
                  {displayNumber(
                    report.feedUsed,
                  )}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-muted">
                  Ayam Mati
                </p>

                <p className="mt-1 text-sm font-medium text-foreground">
                  {displayNumber(
                    report.mortality,
                  )}
                </p>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}