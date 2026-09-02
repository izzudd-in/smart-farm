"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutGrid, Table2 } from "lucide-react";

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

const formatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 2,
});

function valueKg(value: number | null): string {
  return value === null ? "—" : `${formatter.format(value)} kg`;
}

export function ProductionHistoryList({
  rows,
  filters,
  showKandang = true,
}: ProductionHistoryListProps) {
  const [viewMode, setViewMode] = useState<"card" | "table">("table");

  if (rows.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="font-medium text-foreground">
          Belum ada data produksi pada periode ini.
        </p>
        <p className="mt-1 text-sm text-muted">
          Data akan otomatis terisi saat Operator menginput Laporan Harian (Daily Operations).
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted font-medium">
          Menampilkan {rows.length} riwayat laporan
        </span>

        <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1 rounded-md px-2 py-1 transition-colors ${
              viewMode === "table"
                ? "bg-primary text-white font-medium shadow-xs"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Table2 className="h-3.5 w-3.5" />
            <span>Tabel</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("card")}
            className={`flex items-center gap-1 rounded-md px-2 py-1 transition-colors ${
              viewMode === "card"
                ? "bg-primary text-white font-medium shadow-xs"
                : "text-muted hover:text-foreground"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Kartu</span>
          </button>
        </div>
      </div>

      {/* Table View */}
      {viewMode === "table" ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-[#F9FAFB] font-semibold text-[#4B5563]">
                <tr>
                  <th className="px-3 py-2.5">Tanggal</th>
                  {showKandang ? <th className="px-3 py-2.5">Kandang</th> : null}
                  <th className="px-3 py-2.5">Flock</th>
                  <th className="px-3 py-2.5 text-right">Total Telur</th>
                  <th className="px-3 py-2.5 text-right">Telur Jual</th>
                  <th className="px-3 py-2.5 text-right">Telur Rusak</th>
                  <th className="px-3 py-2.5 text-right">Pakan</th>
                  <th className="px-3 py-2.5 text-right">FCR</th>
                  <th className="px-3 py-2.5 text-right">HD (%)</th>
                  <th className="px-3 py-2.5 text-right">Mati</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                  {showKandang ? <th className="px-3 py-2.5 text-center">Aksi</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => {
                  const query = new URLSearchParams();
                  if (filters) {
                    query.set("from", filters.from);
                    query.set("to", filters.to);
                  }
                  query.set("flock", row.flockId);

                  return (
                    <tr key={row.id} className="hover:bg-[#F9FAFB]/75 transition-colors">
                      <td className="whitespace-nowrap px-3 py-2.5 font-medium text-foreground">
                        {formatReportDate(row.date)}
                      </td>
                      {showKandang ? (
                        <td className="whitespace-nowrap px-3 py-2.5 font-semibold text-foreground">
                          {row.kandangCode}
                        </td>
                      ) : null}
                      <td className="whitespace-nowrap px-3 py-2.5 text-muted max-w-[120px] truncate">
                        {row.flockName}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold text-foreground">
                        {valueKg(row.totalEgg)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right text-foreground">
                        {valueKg(row.saleableEgg)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right">
                        <span className={row.damagedPercentage && row.damagedPercentage > 3 ? "font-semibold text-danger" : "text-foreground"}>
                          {valueKg(row.damagedEgg)}
                        </span>
                        {row.damagedPercentage !== null ? (
                          <span className="ml-1 text-[10px] text-muted">
                            ({row.damagedPercentage.toFixed(1)}%)
                          </span>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right text-foreground">
                        {valueKg(row.feedUsed)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-medium text-foreground">
                        {row.fcr !== null ? formatter.format(row.fcr) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-medium text-foreground">
                        {row.henDay !== null && row.henDay !== undefined ? `${row.henDay}%` : "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right">
                        <span className={row.mortality && row.mortality > 0 ? "font-semibold text-danger" : "text-muted"}>
                          {row.mortality ?? 0}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-center">
                        <ReportStatusBadge status={row.status} />
                      </td>
                      {showKandang ? (
                        <td className="whitespace-nowrap px-3 py-2.5 text-center">
                          <Link
                            href={`/production/${row.kandangId}?${query.toString()}`}
                            className="font-semibold text-primary-hover hover:underline"
                          >
                            Detail
                          </Link>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* Card View */
        <div className="space-y-2.5">
          {rows.map((row) => {
            const query = new URLSearchParams();
            if (filters) {
              query.set("from", filters.from);
              query.set("to", filters.to);
            }
            query.set("flock", row.flockId);

            return (
              <Card key={row.id} className="min-w-0 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {showKandang
                        ? `${row.kandangCode} · ${row.kandangName}`
                        : row.flockName}
                    </p>

                    <p className="mt-0.5 text-xs text-muted">
                      {formatReportDate(row.date)}
                      {showKandang ? ` · ${row.flockName}` : ""}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <ReportStatusBadge status={row.status} />

                    {showKandang ? (
                      <Link
                        href={`/production/${row.kandangId}?${query.toString()}`}
                        className="rounded bg-primary-soft px-2 py-1 text-xs font-semibold text-primary-hover hover:bg-primary/20"
                      >
                        Detail Kandang
                      </Link>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 sm:grid-cols-6 text-xs">
                  <div>
                    <span className="text-muted">Total Produksi</span>
                    <p className="mt-0.5 font-bold text-foreground">
                      {valueKg(row.totalEgg)}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted">Telur Jual</span>
                    <p className="mt-0.5 font-medium text-foreground">
                      {valueKg(row.saleableEgg)}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted">Telur Rusak</span>
                    <p className="mt-0.5 font-medium text-foreground">
                      {valueKg(row.damagedEgg)}{" "}
                      {row.damagedPercentage !== null ? (
                        <span className="text-[10px] text-muted">
                          ({row.damagedPercentage.toFixed(1)}%)
                        </span>
                      ) : null}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted">Pakan & FCR</span>
                    <p className="mt-0.5 font-medium text-foreground">
                      {valueKg(row.feedUsed)}{" "}
                      <span className="text-[10px] text-muted">
                        (FCR: {row.fcr !== null ? formatter.format(row.fcr) : "—"})
                      </span>
                    </p>
                  </div>

                  <div>
                    <span className="text-muted">Hen-Day (HD)</span>
                    <p className="mt-0.5 font-bold text-foreground">
                      {row.henDay !== null && row.henDay !== undefined ? `${row.henDay}%` : "—"}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted">Ayam Mati</span>
                    <p className={`mt-0.5 font-medium ${row.mortality && row.mortality > 0 ? "text-danger font-semibold" : "text-foreground"}`}>
                      {row.mortality ?? 0} ekor
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}