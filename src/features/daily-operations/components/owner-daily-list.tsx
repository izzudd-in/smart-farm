"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  Banknote,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  LayoutGrid,
  MessageSquareText,
  Table2,
  UserRound,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import type { OwnerDailyRow } from "@/features/daily-operations/types/daily-report";

import { ReportStatusBadge } from "./report-status-badge";

type OwnerDailyListProps = {
  rows: OwnerDailyRow[];
};

type SortKey = "kandang" | "saleable" | "damaged" | "feed" | "mortality" | "status";
type SortDirection = "asc" | "desc";

const numberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 2,
});

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 2,
});

function metric(
  value: number | null | undefined,
  suffix: string,
): string {
  return value === null || value === undefined
    ? "—"
    : `${numberFormatter.format(value)} ${suffix}`;
}

export function OwnerDailyList({ rows }: OwnerDailyListProps) {
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [sortKey, setSortKey] = useState<SortKey>("kandang");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  // Collapse detail by default: empty set means all rows collapsed
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const toggleRowExpanded = (kandangId: string) => {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(kandangId)) {
        next.delete(kandangId);
      } else {
        next.add(kandangId);
      }
      return next;
    });
  };

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      switch (sortKey) {
        case "kandang":
          valA = a.kandangCode;
          valB = b.kandangCode;
          break;
        case "saleable":
          valA = a.report?.saleableEgg ?? -1;
          valB = b.report?.saleableEgg ?? -1;
          break;
        case "damaged":
          valA = a.report?.damagedEgg ?? -1;
          valB = b.report?.damagedEgg ?? -1;
          break;
        case "feed":
          valA = a.report?.feedUsed ?? -1;
          valB = b.report?.feedUsed ?? -1;
          break;
        case "mortality":
          valA = a.report?.mortality ?? -1;
          valB = b.report?.mortality ?? -1;
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
          Tidak ada laporan sesuai filter.
        </p>
        <p className="mt-1 text-sm text-muted">
          Ubah tanggal, kandang, atau status untuk melihat data lain.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header controls: Counter & View Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-muted">
          Menampilkan <b>{rows.length}</b> laporan kandang
        </span>

        <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors ${
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
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors ${
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

      {/* Table View (with Zebra striping, column sorting, spacing, collapsed detail by default) */}
      {viewMode === "table" ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-[#F3F4F6] font-semibold text-[#374151]">
                <tr>
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleSort("kandang")}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <span>Kandang & Flock</span>
                      <ArrowUpDown className="h-3 w-3 text-muted" />
                    </button>
                  </th>

                  <th className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleSort("status")}
                      className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <span>Status</span>
                      <ArrowUpDown className="h-3 w-3 text-muted" />
                    </button>
                  </th>

                  <th className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("saleable")}
                      className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <span>Telur Jual (kg)</span>
                      <ArrowUpDown className="h-3 w-3 text-muted" />
                    </button>
                  </th>

                  <th className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("damaged")}
                      className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <span>Telur Rusak (butir)</span>
                      <ArrowUpDown className="h-3 w-3 text-muted" />
                    </button>
                  </th>

                  <th className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("feed")}
                      className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <span>Pakan</span>
                      <ArrowUpDown className="h-3 w-3 text-muted" />
                    </button>
                  </th>

                  <th className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("mortality")}
                      className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <span>Ayam Mati</span>
                      <ArrowUpDown className="h-3 w-3 text-muted" />
                    </button>
                  </th>

                  <th className="px-4 py-3 text-center">Detail Insiden</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {sortedRows.map((row, idx) => {
                  const report = row.report;
                  const isExpanded = expandedRowIds.has(row.kandangId);
                  const hasIncident = !!(report?.incidentalExpense || report?.incidentNote);

                  // Zebra striping: alternate bg-white and bg-[#F9FAFB]/75
                  const stripeClass = idx % 2 === 0 ? "bg-white" : "bg-[#F9FAFB]/75";

                  return (
                    <tr
                      key={row.kandangId}
                      className={`${stripeClass} hover:bg-primary-soft/30 transition-colors`}
                    >
                      {/* Kandang & Flock */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <p className="font-bold text-foreground">
                          {row.kandangCode} · {row.kandangName}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted truncate max-w-[150px]">
                          {row.flockName ?? "Belum ada flock"}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-center">
                        <ReportStatusBadge status={row.status} />
                      </td>

                      {/* Telur Jual */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-foreground">
                        {metric(report?.saleableEgg, "kg")}
                      </td>

                      {/* Telur Rusak */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-right text-muted">
                        <span className={report?.damagedEgg && report.damagedEgg > 2 ? "font-semibold text-danger" : ""}>
                          {metric(report?.damagedEgg, "butir")}
                        </span>
                      </td>

                      {/* Pakan */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-medium text-foreground">
                        {metric(report?.feedUsed, "kg")}
                      </td>

                      {/* Ayam Mati */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-right">
                        <span className={report?.mortality && report.mortality > 0 ? "font-semibold text-danger" : "text-muted"}>
                          {report?.mortality === null || report?.mortality === undefined
                            ? "—"
                            : `${numberFormatter.format(report.mortality)} ekor`}
                        </span>
                      </td>

                      {/* Detail Insiden (Collapsed by default) */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-center">
                        {hasIncident ? (
                          <button
                            type="button"
                            onClick={() => toggleRowExpanded(row.kandangId)}
                            className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                          >
                            <span>Ada Insiden</span>
                            {isExpanded ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </button>
                        ) : (
                          <span className="text-[11px] text-muted">—</span>
                        )}

                        {/* Collapsed/Expanded Box */}
                        {isExpanded && hasIncident ? (
                          <div className="mt-2 text-left space-y-1.5 rounded-lg border border-border bg-white p-2.5 shadow-xs text-xs">
                            {report?.incidentalExpense ? (
                              <div className="flex items-center gap-1 text-foreground">
                                <Banknote className="h-3.5 w-3.5 text-muted" />
                                <span>{currencyFormatter.format(Number(report.incidentalExpense))}</span>
                              </div>
                            ) : null}
                            {report?.incidentNote ? (
                              <div className="flex items-start gap-1 text-muted">
                                <MessageSquareText className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                <span>{report.incidentNote}</span>
                              </div>
                            ) : null}
                            {row.operatorNames.length > 0 ? (
                              <div className="flex items-center gap-1 text-[11px] text-muted border-t border-border pt-1">
                                <UserRound className="h-3 w-3" />
                                <span>Operator: {row.operatorNames.join(", ")}</span>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </td>

                      {/* Aksi */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-center">
                        {report ? (
                          <Link
                            href={`/daily/${report.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1 text-xs font-semibold text-primary-hover hover:bg-primary-soft transition-colors"
                          >
                            <span>Detail</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* Card View (with spacing and collapsed detail by default) */
        <div className="space-y-3">
          {sortedRows.map((row) => {
            const report = row.report;
            const isExpanded = expandedRowIds.has(row.kandangId);
            const hasIncident = !!(report?.incidentalExpense || report?.incidentNote);

            return (
              <Card key={row.kandangId} className="min-w-0 p-4 transition-shadow hover:shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-foreground">
                        {row.kandangCode} · {row.kandangName}
                      </h2>
                      <ReportStatusBadge status={row.status} />
                    </div>

                    <p className="mt-1 truncate text-xs text-muted">
                      {row.flockName ?? "Belum ada flock pada tanggal ini"}
                    </p>
                  </div>

                  {report ? (
                    <Link
                      href={`/daily/${report.id}`}
                      className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-border bg-white px-2.5 text-xs font-semibold text-primary-hover hover:bg-primary-soft transition-colors"
                    >
                      Detail
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : null}
                </div>

                <div className="mt-3.5 grid grid-cols-2 gap-3 border-t border-border pt-3 sm:grid-cols-4">
                  <div>
                    <p className="text-[11px] text-muted">Telur Jual</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                      {metric(report?.saleableEgg, "kg")}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-muted">Telur Rusak</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                      {metric(report?.damagedEgg, "butir")}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-muted">Pakan</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                      {metric(report?.feedUsed, "kg")}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-muted">Ayam Mati</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                      {report?.mortality === null || report?.mortality === undefined
                        ? "—"
                        : `${numberFormatter.format(report.mortality)} ekor`}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex min-w-0 items-center justify-between border-t border-border pt-2 text-xs text-muted">
                  <div className="flex items-center gap-1.5 truncate">
                    <UserRound className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {row.operatorNames.length > 0
                        ? row.operatorNames.join(", ")
                        : "Belum ada operator"}
                    </span>
                  </div>

                  {/* Collapse detail by default button */}
                  {hasIncident ? (
                    <button
                      type="button"
                      onClick={() => toggleRowExpanded(row.kandangId)}
                      className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                    >
                      <span>{isExpanded ? "Sembunyikan Insiden" : "Lihat Insiden"}</span>
                      {isExpanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                  ) : null}
                </div>

                {isExpanded && hasIncident ? (
                  <div className="mt-3 space-y-2 rounded-[10px] bg-[#F9FAFB] p-3 border border-border">
                    {report?.incidentalExpense ? (
                      <div className="flex items-start gap-2 text-xs">
                        <Banknote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
                        <span className="font-semibold text-foreground">
                          {currencyFormatter.format(Number(report.incidentalExpense))}
                        </span>
                      </div>
                    ) : null}

                    {report?.incidentNote ? (
                      <div className="flex items-start gap-2 text-xs">
                        <MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
                        <span className="text-muted">{report.incidentNote}</span>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}