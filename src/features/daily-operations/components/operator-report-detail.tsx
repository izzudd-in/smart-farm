import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  UserRound,
  Wheat,
} from "lucide-react";

import type { DailyReportView } from "@/features/daily-operations/types/daily-report";
import { formatReportDate } from "@/features/daily-operations/utils/date";
import { Card } from "@/components/ui/card";

import { ReportStatusBadge } from "./report-status-badge";

type OperatorReportDetailProps = {
  report: DailyReportView;
};

function displayNumber(
  value: number | null,
): string {
  return value === null
    ? "—"
    : new Intl.NumberFormat(
        "id-ID",
        {
          maximumFractionDigits: 2,
        },
      ).format(value);
}

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

export function OperatorReportDetail({
  report,
}: OperatorReportDetailProps) {
  return (
    <div className="space-y-4">
      <Link
        href="/operator/history"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Riwayat
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Metric
              label="Telur Jual"
              value={displayNumber(
                report.saleableEgg,
              )}
            />

            <Metric
              label="Telur Rusak"
              value={displayNumber(
                report.damagedEgg,
              )}
            />

            <Metric
              label="Ayam Mati"
              value={displayNumber(
                report.mortality,
              )}
            />
          </div>

          {(report.feedUsed !== null ||
            report.feedItems.length >
              0) ? (
            <div className="rounded-[10px] border border-border p-4">
              <div className="flex items-center gap-2">
                <Wheat className="h-4 w-4 text-primary-hover" />

                <h2 className="text-sm font-semibold text-foreground">
                  Pakan
                </h2>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted">
                    Pakan Digunakan
                  </p>

                  <p className="mt-1 text-sm font-medium text-foreground">
                    {report.feedUsed ===
                    null
                      ? "—"
                      : `${displayNumber(
                          report.feedUsed,
                        )} kg`}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted">
                    Formula
                  </p>

                  <p className="mt-1 text-sm font-medium text-foreground">
                    {report.feedFormulaName ??
                      "—"}
                  </p>
                </div>
              </div>

              {report.feedItems.length >
              0 ? (
                <div className="mt-4 border-t border-border pt-3">
                  <p className="text-xs text-muted">
                    Komposisi Aktual
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {report.feedItems.map(
                      (item) => (
                        <span
                          key={
                            item.ingredientId
                          }
                          className="rounded-full bg-[#F3F4F6] px-2.5 py-1 text-xs text-foreground"
                        >
                          {
                            item.ingredientName
                          }{" "}
                          {Number(
                            item.percentage,
                          ).toLocaleString(
                            "id-ID",
                            {
                              maximumFractionDigits:
                                2,
                            },
                          )}
                          %
                        </span>
                      ),
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {(report.incidentalExpense ||
            report.incidentNote) ? (
            <div className="border-t border-border pt-4">
              <h2 className="text-sm font-semibold text-foreground">
                Pengeluaran / Kejadian
              </h2>

              {report.incidentalExpense ? (
                <div className="mt-3">
                  <p className="text-xs text-muted">
                    Pengeluaran Insidental
                  </p>

                  <p className="mt-1 font-medium text-foreground">
                    Rp{" "}
                    {new Intl.NumberFormat(
                      "id-ID",
                      {
                        maximumFractionDigits:
                          2,
                      },
                    ).format(
                      Number(
                        report.incidentalExpense,
                      ),
                    )}
                  </p>
                </div>
              ) : null}

              {report.incidentNote ? (
                <div className="mt-3">
                  <p className="text-xs text-muted">
                    Kejadian / Catatan
                  </p>

                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground">
                    {report.incidentNote}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}