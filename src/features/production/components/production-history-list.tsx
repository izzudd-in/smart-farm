"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, LayoutGrid, Table2 } from "lucide-react";

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

type SortKey =
  | "date"
  | "kandang"
  | "flock"
  | "totalEgg"
  | "saleableEgg"
  | "damagedEgg"
  | "feedUsed"
  | "fcr"
  | "henDay"
  | "mortality"
  | "status";

type SortDirection = "asc" | "desc";

const formatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 2,
});

function valueKg(value: number | null): string {
  return value === null ? "—" : `${formatter.format(value)} kg`;
}

function valueCount(value: number | null, suffix = "butir"): string {
  return value === null ? "—" : `${formatter.format(value)} ${suffix}`;
}

export function ProductionHistoryList({
  rows,
  filters,
  showKandang = true,
}: ProductionHistoryListProps) {
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      switch (sortKey) {
        case "date":
          valA = a.date;
          valB = b.date;
          break;
        case "kandang":
          valA = a.kandangCode;
          valB = b.kandangCode;
          break;
        case "flock":
          valA = a.flockName;
          valB = b.flockName;
          break;
        case "totalEgg":
          valA = a.totalEgg ?? -1;
          valB = b.totalEgg ?? -1;
          break;
        case "saleableEgg":
          valA = a.saleableEgg ?? -1;
          valB = b.saleableEgg ?? -1;
          break;
        case "damagedEgg":
          valA = a.damagedEgg ?? -1;
          valB = b.damagedEgg ?? -1;
          break;
        case "feedUsed":
          valA = a.feedUsed ?? -1;
          valB = b.feedUsed ?? -1;
          break;
        case "fcr":
          valA = a.fcr ?? -1;
          valB = b.fcr ?? -1;
          break;
        case "henDay":
          valA = a.henDay ?? -1;
          valB = b.henDay ?? -1;
          break;
        case "mortality":
          valA = a.mortality ?? -1;
          valB = b.mortality ?? -1;
          break;
        case "status":
          valA = a.status;
          valB = b.status;
          break;
      }

      if (typeof valA === "string" && typeof valB === "string") {
        return sortDirection === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      return sortDirection === "asc"
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });
  }, [rows, sortKey, sortDirection]);

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
      {/* View Mode Toggle & Counter */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted font-medium">
          Menampilkan <b>{rows.length}</b> riwayat laporan produksi
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
            <span>Tabel Zebra</span>
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

      {/* Table View with Zebra Striping and Column Sorting (HE-003, DT-002) */}
      {viewMode === "table" ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-[#F3F4F6] font-semibold text-[#374151]">
                <tr>
                  <th className="px-3.5 py-3">
                    <button
                      type="button"
                      onClick={() => handleSort("date")}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <span>Tanggal</span>
                      <ArrowUpDown className="h-3 w-3 text-muted" />
                    </button>
                  </th>

                  {showKandang ? (
                    <th className="px-3.5 py-3">
                      <button
                        type="button"
                        onClick={() => handleSort("kandang")}
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        <span>Kandang</span>
                        <ArrowUpDown className="h-3 w-3 text-muted" />
                      </button>
                    </th>
                  ) : null}

                  <th className="px-3.5 py-3">
                    <button
                      type="button"
                      onClick={() => handleSort("flock")}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <span>Flock</span>
                      <ArrowUpDown className="h-3 w-3 text-muted" />
                    </button>
                  </th>

                  <th className="px-3.5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("saleableEgg")}
                      className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <span>Telur Jual (kg)</span>
                      <ArrowUpDown className="h-3 w-3 text-muted" />
                    </button>
                  </th>

                  <th className="px-3.5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("damagedEgg")}
                      className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <span>Telur Rusak (butir)</span>
                      <ArrowUpDown className="h-3 w-3 text-muted" />
                    </button>
                  </th>

                  <th className="px-3.5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("feedUsed")}
                      className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <span>Pakan (kg)</span>
                      <ArrowUpDown className="h-3 w-3 text-muted" />
                    </button>
                  </th>

                  <th className="px-3.5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("fcr")}
                      className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <span>FCR</span>
                      <ArrowUpDown className="h-3 w-3 text-muted" />
                    </button>
                  </th>

                  <th className="px-3.5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("henDay")}
                      className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <span>HD (%)</span>
                      <ArrowUpDown className="h-3 w-3 text-muted" />
                    </button>
                  </th>

                  <th className="px-3.5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("mortality")}
                      className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <span>Mati</span>
                      <ArrowUpDown className="h-3 w-3 text-muted" />
                    </button>
                  </th>

                  <th className="px-3.5 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleSort("status")}
                      className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <span>Status</span>
                      <ArrowUpDown className="h-3 w-3 text-muted" />
                    </button>
                  </th>

                  {showKandang ? <th className="px-3.5 py-3 text-center">Aksi</th> : null}
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {sortedRows.map((row, idx) => {
                  const query = new URLSearchParams();
                  if (filters) {
                    query.set("from", filters.from);
                    query.set("to", filters.to);
                  }
                  query.set("flock", row.flockId);

                  // Zebra striping (HE-003)
                  const stripeClass = idx % 2 === 0 ? "bg-white" : "bg-[#F9FAFB]/75";

                  return (
                    <tr
                      key={row.id}
                      className={`${stripeClass} hover:bg-primary-soft/30 transition-colors`}
                    >
                      <td className="whitespace-nowrap px-3.5 py-3 font-medium text-foreground">
                        {formatReportDate(row.date)}
                      </td>

                      {showKandang ? (
                        <td className="whitespace-nowrap px-3.5 py-3 font-semibold text-foreground">
                          {row.kandangCode}
                        </td>
                      ) : null}

                      <td className="whitespace-nowrap px-3.5 py-3 text-muted max-w-[120px] truncate">
                        {row.flockName}
                      </td>

                      {/* Telur Jual (kg) */}
                      <td className="whitespace-nowrap px-3.5 py-3 text-right font-semibold text-foreground">
                        {valueKg(row.saleableEgg)}
                      </td>

                      {/* Telur Rusak (butir) (DT-002: no unit mixing) */}
                      <td className="whitespace-nowrap px-3.5 py-3 text-right">
                        <span className={row.damagedPercentage && row.damagedPercentage > 3 ? "font-semibold text-danger" : "text-muted"}>
                          {valueCount(row.damagedEgg, "butir")}
                        </span>
                        {row.damagedPercentage !== null ? (
                          <span className="ml-1 text-[10px] text-muted">
                            ({row.damagedPercentage.toFixed(1)}%)
                          </span>
                        ) : null}
                      </td>

                      {/* Pakan (kg) */}
                      <td className="whitespace-nowrap px-3.5 py-3 text-right text-foreground">
                        {valueKg(row.feedUsed)}
                      </td>

                      {/* FCR */}
                      <td className="whitespace-nowrap px-3.5 py-3 text-right font-medium text-foreground">
                        {row.fcr !== null ? formatter.format(row.fcr) : "—"}
                      </td>

                      {/* Hen-Day (%) */}
                      <td className="whitespace-nowrap px-3.5 py-3 text-right font-medium text-foreground">
                        {row.henDay !== null && row.henDay !== undefined ? `${row.henDay}%` : "—"}
                      </td>

                      {/* Ayam Mati */}
                      <td className="whitespace-nowrap px-3.5 py-3 text-right">
                        <span className={row.mortality && row.mortality > 0 ? "font-semibold text-danger" : "text-muted"}>
                          {row.mortality ?? 0}
                        </span>
                      </td>

                      {/* Status Visual Indicator: Hijau for Complete, Kuning for Draft/Incomplete (HE-003) */}
                      <td className="whitespace-nowrap px-3.5 py-3 text-center">
                        <ReportStatusBadge status={row.status} />
                      </td>

                      {showKandang ? (
                        <td className="whitespace-nowrap px-3.5 py-3 text-center">
                          <Link
                            href={`/production/${row.kandangId}?${query.toString()}`}
                            className="inline-flex items-center rounded-lg border border-border bg-white px-2 py-0.5 font-semibold text-primary-hover hover:bg-primary-soft transition-colors"
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
        <div className="space-y-3">
          {sortedRows.map((row) => {
            const query = new URLSearchParams();
            if (filters) {
              query.set("from", filters.from);
              query.set("to", filters.to);
            }
            query.set("flock", row.flockId);

            return (
              <Card key={row.id} className="min-w-0 p-4 transition-shadow hover:shadow-xs">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">
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
                        className="rounded-lg bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary-hover hover:bg-primary/20 transition-colors"
                      >
                        Detail Kandang
                      </Link>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 sm:grid-cols-4">
                  <div>
                    <p className="text-[11px] text-muted">Telur Jual (kg)</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                      {valueKg(row.saleableEgg)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-muted">Telur Rusak (butir)</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                      {valueCount(row.damagedEgg, "butir")}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-muted">FCR / HD (%)</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                      {row.fcr !== null ? formatter.format(row.fcr) : "—"} /{" "}
                      {row.henDay !== null ? `${row.henDay}%` : "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-muted">Pakan / Mati</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                      {valueKg(row.feedUsed)} / {row.mortality ?? 0} ekor
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