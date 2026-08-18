import Link from "next/link";
import {
  Banknote,
  ChevronRight,
  MessageSquareText,
  UserRound,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import type { OwnerDailyRow } from "@/features/daily-operations/types/daily-report";

import { ReportStatusBadge } from "./report-status-badge";

type OwnerDailyListProps = {
  rows: OwnerDailyRow[];
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

function metric(
  value: number | null | undefined,
  suffix: string,
): string {
  return value === null ||
    value === undefined
    ? `— ${suffix}`
    : `${numberFormatter.format(value)} ${suffix}`;
}

export function OwnerDailyList({
  rows,
}: OwnerDailyListProps) {
  if (rows.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="font-medium text-foreground">
          Tidak ada laporan sesuai
          filter.
        </p>

        <p className="mt-1 text-sm text-muted">
          Ubah tanggal, kandang, atau
          status untuk melihat data lain.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const report = row.report;

        return (
          <Card
            key={row.kandangId}
            className="min-w-0 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-foreground">
                      {row.kandangCode} ·{" "}
                      {row.kandangName}
                    </h2>

                    <ReportStatusBadge
                      status={row.status}
                    />
                  </div>

                  <p className="mt-1 truncate text-xs text-muted">
                    {row.flockName ??
                      "Belum ada flock pada tanggal ini"}
                  </p>
                </div>

                {report ? (
                  <Link
                    href={`/daily/${report.id}`}
                    className="inline-flex h-9 shrink-0 items-center gap-1 rounded-[10px] border border-border bg-white px-3 text-xs font-medium text-foreground hover:bg-[#F9FAFB]"
                  >
                    Detail

                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                ) : null}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <p className="text-[11px] text-muted">
                    Telur Jual
                  </p>

                  <p className="mt-1 text-sm font-medium text-foreground">
                    {metric(
                      report?.saleableEgg,
                      "kg",
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-muted">
                    Telur Rusak
                  </p>

                  <p className="mt-1 text-sm font-medium text-foreground">
                    {metric(
                      report?.damagedEgg,
                      "kg",
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-muted">
                    Pakan
                  </p>

                  <p className="mt-1 text-sm font-medium text-foreground">
                    {metric(
                      report?.feedUsed,
                      "kg",
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-muted">
                    Ayam Mati
                  </p>

                  <p className="mt-1 text-sm font-medium text-foreground">
                    {report?.mortality ===
                      null ||
                    report?.mortality ===
                      undefined
                      ? "—"
                      : `${numberFormatter.format(
                          report.mortality,
                        )} ekor`}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex min-w-0 items-center gap-2 border-t border-border pt-3 text-xs text-muted">
                <UserRound className="h-3.5 w-3.5 shrink-0" />

                <span className="truncate">
                  {row.operatorNames
                    .length > 0
                    ? row.operatorNames.join(
                        ", ",
                      )
                    : "Belum ada operator"}
                </span>
              </div>

              {report &&
              (report.incidentalExpense ||
                report.incidentNote) ? (
                <div className="mt-3 space-y-2 rounded-[10px] bg-[#F9FAFB] p-3">
                  {report.incidentalExpense ? (
                    <div className="flex items-start gap-2 text-xs">
                      <Banknote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />

                      <span className="text-foreground">
                        {currencyFormatter.format(
                          Number(
                            report.incidentalExpense,
                          ),
                        )}
                      </span>
                    </div>
                  ) : null}

                  {report.incidentNote ? (
                    <div className="flex items-start gap-2 text-xs">
                      <MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />

                      <span className="line-clamp-2 text-muted">
                        {report.incidentNote}
                      </span>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </Card>
        );
      })}
    </div>
  );
}