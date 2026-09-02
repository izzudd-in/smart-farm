import Link from "next/link";
import { Calendar, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  OwnerDailyFilters,
  OwnerDailyKandangOption,
  OwnerDailyStatusFilter,
} from "@/features/daily-operations/types/daily-report";
import {
  getJakartaTodayString,
  parseDateOnly,
} from "@/features/daily-operations/utils/date";
import { getDailyReportStatusLabel } from "@/features/daily-operations/utils/status";

type OwnerDailyFiltersProps = {
  filters: OwnerDailyFilters;
  kandangs: OwnerDailyKandangOption[];
};

const STATUS_OPTIONS: OwnerDailyStatusFilter[] = [
  "ALL",
  "COMPLETE",
  "INCOMPLETE",
  "NOT_STARTED",
];

function getRelativeDate(daysAgo: number): string {
  const d = parseDateOnly(getJakartaTodayString());
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

export function OwnerDailyFiltersPanel({
  filters,
  kandangs,
}: OwnerDailyFiltersProps) {
  const today = getJakartaTodayString();
  const yesterday = getRelativeDate(1);
  const twoDaysAgo = getRelativeDate(2);
  const threeDaysAgo = getRelativeDate(3);

  return (
    <Card className="p-4 space-y-4">
      {/* Quick Date Presets (UX-004, RSP-002: touch target >= 44px, text-sm >= 14px) */}
      <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-border text-sm">
        <span className="font-semibold text-muted flex items-center gap-1.5 mr-1 text-sm">
          <Calendar className="h-4 w-4 text-primary" />
          Pilih Cepat:
        </span>
        <Link
          href={`/daily?date=${today}${filters.kandangId ? `&kandang=${filters.kandangId}` : ""}${filters.status !== "ALL" ? `&status=${filters.status}` : ""}`}
          className={`inline-flex items-center justify-center min-h-[44px] rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            filters.date === today
              ? "bg-primary text-white shadow-xs"
              : "bg-[#F3F4F6] text-[#374151] hover:bg-border hover:text-foreground"
          }`}
        >
          Hari Ini
        </Link>
        <Link
          href={`/daily?date=${yesterday}${filters.kandangId ? `&kandang=${filters.kandangId}` : ""}${filters.status !== "ALL" ? `&status=${filters.status}` : ""}`}
          className={`inline-flex items-center justify-center min-h-[44px] rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            filters.date === yesterday
              ? "bg-primary text-white shadow-xs"
              : "bg-[#F3F4F6] text-[#374151] hover:bg-border hover:text-foreground"
          }`}
        >
          Kemarin
        </Link>
        <Link
          href={`/daily?date=${twoDaysAgo}${filters.kandangId ? `&kandang=${filters.kandangId}` : ""}${filters.status !== "ALL" ? `&status=${filters.status}` : ""}`}
          className={`inline-flex items-center justify-center min-h-[44px] rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            filters.date === twoDaysAgo
              ? "bg-primary text-white shadow-xs"
              : "bg-[#F3F4F6] text-[#374151] hover:bg-border hover:text-foreground"
          }`}
        >
          H-2
        </Link>
        <Link
          href={`/daily?date=${threeDaysAgo}${filters.kandangId ? `&kandang=${filters.kandangId}` : ""}${filters.status !== "ALL" ? `&status=${filters.status}` : ""}`}
          className={`inline-flex items-center justify-center min-h-[44px] rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            filters.date === threeDaysAgo
              ? "bg-primary text-white shadow-xs"
              : "bg-[#F3F4F6] text-[#374151] hover:bg-border hover:text-foreground"
          }`}
        >
          H-3
        </Link>
      </div>

      <form
        method="get"
        className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-[190px_1fr_190px_auto]"
      >
        <div>
          <label
            htmlFor="date"
            className="mb-1.5 block text-sm font-medium text-[#374151]"
          >
            Tanggal Spesifik
          </label>

          <input
            id="date"
            name="date"
            type="date"
            max={getJakartaTodayString()}
            defaultValue={filters.date}
            className="min-h-[44px] h-11 w-full rounded-[10px] border border-border bg-white px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <div>
          <label
            htmlFor="kandang"
            className="mb-1.5 block text-sm font-medium text-[#374151]"
          >
            Kandang
          </label>

          <select
            id="kandang"
            name="kandang"
            defaultValue={filters.kandangId}
            className="min-h-[44px] h-11 w-full rounded-[10px] border border-border bg-white px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
          >
            <option value="">Semua Kandang</option>
            {kandangs.map((kandang) => (
              <option key={kandang.id} value={kandang.id}>
                {kandang.code} · {kandang.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="status"
            className="mb-1.5 block text-sm font-medium text-[#374151]"
          >
            Status Laporan
          </label>

          <select
            id="status"
            name="status"
            defaultValue={filters.status}
            className="min-h-[44px] h-11 w-full rounded-[10px] border border-border bg-white px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === "ALL"
                  ? "Semua Status"
                  : getDailyReportStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2 pt-1 sm:pt-0">
          <Button
            type="submit"
            className="min-h-[44px] h-11 flex-1 sm:flex-none px-5 text-sm font-semibold"
          >
            Terapkan
          </Button>

          <Link
            href="/daily"
            className="inline-flex min-h-[44px] h-11 items-center justify-center rounded-[10px] border border-border bg-white px-4 text-sm font-medium text-foreground hover:bg-[#F9FAFB] gap-1.5 transition-colors"
          >
            <RotateCcw className="h-4 w-4 text-muted" />
            <span>Reset</span>
          </Link>
        </div>
      </form>
    </Card>
  );
}