import Link from "next/link";

import {
  ArrowLeft,
  CalendarDays,
  UserRound,
  Wheat,
} from "lucide-react";

import {
  Card,
} from "@/components/ui/card";

import type {
  DailyReportView,
} from "@/features/daily-operations/types/daily-report";

import {
  formatReportDate,
} from "@/features/daily-operations/utils/date";

import {
  DAILY_EXPENSE_CATEGORY_LABELS,
} from "@/features/expenses/types/daily-expense";

import {
  ReportStatusBadge,
} from "./report-status-badge";

type OperatorReportDetailProps = {
  report: DailyReportView;
};

function formatAmount(
  value:
    | number
    | null,
  suffix: string,
): string {
  return value ===
    null
    ? "—"
    : `${new Intl.NumberFormat(
        "id-ID",
        {
          maximumFractionDigits:
            2,
        },
      ).format(
        value,
      )} ${suffix}`;
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
              status={
                report.status
              }
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
              {
                report.operatorName
              }
            </span>
          </div>
        </div>

        <div className="space-y-5 p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
              label="Ayam Mati"
              value={formatAmount(
                report.mortality,
                "ekor",
              )}
            />
          </div>

          {(report.feedUsed !==
            null ||
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

                  <p className="mt-1 text-sm font-medium">
                    {formatAmount(
                      report.feedUsed,
                      "kg",
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted">
                    Formula
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {report.feedFormulaName ??
                      "—"}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {(report.incidentalExpense ||
            report.incidentNote) ? (
            <div className="border-t border-border pt-4">
              <h2 className="text-sm font-semibold text-foreground">
                Pengeluaran / Kejadian
              </h2>

              {report.incidentalExpense ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted">
                      Kategori
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {report.incidentalExpenseCategory
                        ? DAILY_EXPENSE_CATEGORY_LABELS[
                            report.incidentalExpenseCategory
                          ]
                        : "Belum Dikategorikan"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted">
                      Nominal
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {new Intl.NumberFormat(
                        "id-ID",
                        {
                          style:
                            "currency",
                          currency:
                            "IDR",
                        },
                      ).format(
                        Number(
                          report.incidentalExpense,
                        ),
                      )}
                    </p>
                  </div>
                </div>
              ) : null}

              {report.incidentNote ? (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
                  {
                    report.incidentNote
                  }
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}