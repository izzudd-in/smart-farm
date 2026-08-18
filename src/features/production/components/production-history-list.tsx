import Link from "next/link";

import { Card } from "@/components/ui/card";
import { ReportStatusBadge } from "@/features/daily-operations/components/report-status-badge";
import type {
  ProductionFilters,
  ProductionReportRow,
} from "@/features/production/types/production";
import { formatReportDate } from "@/features/daily-operations/utils/date";

type ProductionHistoryListProps = {
  rows: ProductionReportRow[];
  filters?: ProductionFilters;
  showKandang?: boolean;
};

const formatter =
  new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  });

function valueKg(
  value: number | null,
): string {
  return value === null
    ? "—"
    : `${formatter.format(
        value,
      )} kg`;
}

export function ProductionHistoryList({
  rows,
  filters,
  showKandang = true,
}: ProductionHistoryListProps) {
  if (rows.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="font-medium text-foreground">
          Belum ada data produksi
          pada periode ini.
        </p>

        <p className="mt-1 text-sm text-muted">
          Data akan muncul dari Daily
          Operations yang diisi
          Operator.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const query =
          new URLSearchParams();

        if (filters) {
          query.set(
            "from",
            filters.from,
          );

          query.set(
            "to",
            filters.to,
          );
        }

        query.set(
          "flock",
          row.flockId,
        );

        return (
          <Card
            key={row.id}
            className="min-w-0 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {showKandang
                    ? `${row.kandangCode} · ${row.kandangName}`
                    : row.flockName}
                </p>

                <p className="mt-1 text-xs text-muted">
                  {formatReportDate(
                    row.date,
                  )}
                  {showKandang
                    ? ` · ${row.flockName}`
                    : ""}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <ReportStatusBadge
                  status={row.status}
                />

                {showKandang ? (
                  <Link
                    href={`/production/${row.kandangId}?${query.toString()}`}
                    className="text-xs font-medium text-primary-hover"
                  >
                    Detail
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 sm:grid-cols-4">
              <div>
                <p className="text-[11px] text-muted">
                  Total
                </p>

                <p className="mt-1 text-sm font-medium text-foreground">
                  {valueKg(
                    row.totalEgg,
                  )}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-muted">
                  Telur Jual
                </p>

                <p className="mt-1 text-sm font-medium text-foreground">
                  {valueKg(
                    row.saleableEgg,
                  )}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-muted">
                  Rusak
                </p>

                <p className="mt-1 text-sm font-medium text-foreground">
                  {valueKg(
                    row.damagedEgg,
                  )}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-muted">
                  Ayam Mati
                </p>

                <p className="mt-1 text-sm font-medium text-foreground">
                  {row.mortality === null
                    ? "—"
                    : formatter.format(
                        row.mortality,
                      )}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}