import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  MessageSquareText,
  UserRound,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import type { DailyReportView } from "@/features/daily-operations/types/daily-report";
import { formatReportDate } from "@/features/daily-operations/utils/date";

import { ReportStatusBadge } from "./report-status-badge";

type OwnerReportDetailProps = {
  report: DailyReportView;
};

const numberFormatter =
  new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  });

const currencyFormatter =
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 2,
  });

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[10px] border border-border bg-[#F9FAFB] p-3">
      <p className="text-xs text-muted">
        {label}
      </p>

      <p className="mt-1 font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}

function formatAmount(
  value: number | null,
  suffix: string,
): string {
  return value === null
    ? "—"
    : `${numberFormatter.format(value)} ${suffix}`;
}

export function OwnerReportDetail({
  report,
}: OwnerReportDetailProps) {
  return (
    <div className="space-y-4">
      <Link
        href="/daily"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Operasional
      </Link>

      <Card className="overflow-hidden">
        <div className="border-b border-border p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {report.kandangCode} ·{" "}
                {report.kandangName}
              </h1>

              <p className="mt-1 text-sm text-muted">
                {report.flockName}
              </p>
            </div>

            <ReportStatusBadge
              status={report.status}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />

              {formatReportDate(
                report.date,
              )}
            </span>

            <span className="flex items-center gap-1.5">
              <UserRound className="h-3.5 w-3.5" />

              {report.operatorName}
            </span>
          </div>
        </div>

        <div className="space-y-5 p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric
              label="Telur Jual"
              value={formatAmount(
                report.saleableEgg,
                "kg",
              )}
            />

            <Metric
              label="Telur Rusak"
              value={formatAmount(
                report.damagedEgg,
                "kg",
              )}
            />

            <Metric
              label="Pakan Digunakan"
              value={formatAmount(
                report.feedUsed,
                "kg",
              )}
            />

            <Metric
              label="Ayam Mati"
              value={
                report.mortality === null
                  ? "—"
                  : `${numberFormatter.format(
                      report.mortality,
                    )} ekor`
              }
            />
          </div>

          {(report.incidentalExpense ||
            report.incidentNote) ? (
            <div className="border-t border-border pt-4">
              <h2 className="text-sm font-semibold text-foreground">
                Pengeluaran / Kejadian
              </h2>

              <div className="mt-3 space-y-3">
                {report.incidentalExpense ? (
                  <div className="flex items-start gap-2">
                    <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-muted" />

                    <div>
                      <p className="text-xs text-muted">
                        Pengeluaran Insidental
                      </p>

                      <p className="mt-1 text-sm font-medium text-foreground">
                        {currencyFormatter.format(
                          Number(
                            report.incidentalExpense,
                          ),
                        )}
                      </p>
                    </div>
                  </div>
                ) : null}

                {report.incidentNote ? (
                  <div className="flex items-start gap-2">
                    <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-muted" />

                    <div className="min-w-0">
                      <p className="text-xs text-muted">
                        Kejadian / Catatan
                      </p>

                      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                        {report.incidentNote}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}