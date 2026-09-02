"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Calendar,
  CalendarDays,
  CalendarRange,
  Check,
  Clock,
  Loader2,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  ProductionFilters,
  ProductionKandangOption,
  ProductionPeriodMode,
} from "@/features/production/types/production";
import {
  getJakartaTodayString,
  formatReportDate,
} from "@/features/daily-operations/utils/date";
import {
  getStartOfMonth,
  getStartOfWeek,
} from "@/features/production/utils/dates";

type ProductionFiltersProps = {
  filters: ProductionFilters;
  kandangs: ProductionKandangOption[];
};

export function ProductionFiltersPanel({
  filters,
  kandangs,
}: ProductionFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const activeMode: ProductionPeriodMode = filters.mode ?? "weekly";
  const [mode, setMode] = useState<ProductionPeriodMode>(activeMode);
  const [from, setFrom] = useState(filters.from);
  const [to, setTo] = useState(filters.to);
  const [kandangId, setKandangId] = useState(filters.kandangId);
  const [validationError, setValidationError] = useState<string | null>(null);

  const todayStr = getJakartaTodayString();

  const validate = (fromDate: string, toDate: string): boolean => {
    if (!fromDate || !toDate) {
      setValidationError("Tanggal awal dan akhir harus diisi.");
      return false;
    }
    if (fromDate > toDate) {
      setValidationError("Tanggal 'Dari' tidak boleh lebih baru dari 'Sampai'.");
      return false;
    }
    if (toDate > todayStr) {
      setValidationError("Tanggal tidak boleh melebihi hari ini.");
      return false;
    }
    setValidationError(null);
    return true;
  };

  const navigateWithFilters = (
    newMode: ProductionPeriodMode,
    newFrom: string,
    newTo: string,
    newKandang: string,
  ) => {
    if (!validate(newFrom, newTo)) return;

    const params = new URLSearchParams();
    params.set("mode", newMode);
    params.set("from", newFrom);
    params.set("to", newTo);
    if (newKandang) {
      params.set("kandang", newKandang);
    }

    startTransition(() => {
      router.push(`/production?${params.toString()}`);
    });
  };

  const handleSelectMode = (selectedMode: ProductionPeriodMode) => {
    setMode(selectedMode);
    setValidationError(null);

    let newFrom = todayStr;
    const newTo = todayStr;

    if (selectedMode === "today") {
      newFrom = todayStr;
    } else if (selectedMode === "weekly") {
      newFrom = getStartOfWeek(todayStr);
    } else if (selectedMode === "monthly") {
      newFrom = getStartOfMonth(todayStr);
    } else {
      // Custom mode: keep existing or default to weekly
      newFrom = from;
      return;
    }

    setFrom(newFrom);
    setTo(newTo);
    navigateWithFilters(selectedMode, newFrom, newTo, kandangId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateWithFilters(mode, from, to, kandangId);
  };

  const handleReset = () => {
    setMode("weekly");
    setFrom(getStartOfWeek(todayStr));
    setTo(todayStr);
    setKandangId("");
    setValidationError(null);

    startTransition(() => {
      router.push("/production");
    });
  };

  return (
    <Card className="p-4 space-y-3.5">
      {/* Mode Selection Tabs (FT-087, FT-088, FT-089, FT-090) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-semibold text-muted mr-1">
            Mode Analisa:
          </span>

          {/* FT-087: Mode Hari Ini */}
          <button
            type="button"
            onClick={() => handleSelectMode("today")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 min-h-[44px] text-sm font-semibold transition-all ${
              activeMode === "today"
                ? "bg-primary text-white shadow-xs"
                : "bg-[#F3F4F6] text-[#374151] hover:bg-border hover:text-foreground"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Hari Ini</span>
          </button>

          {/* FT-088 & FT-090: Mode Minggu Ini (Default) */}
          <button
            type="button"
            onClick={() => handleSelectMode("weekly")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 min-h-[44px] text-sm font-semibold transition-all ${
              activeMode === "weekly"
                ? "bg-primary text-white shadow-xs"
                : "bg-[#F3F4F6] text-[#374151] hover:bg-border hover:text-foreground"
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            <span>Minggu Ini (Default)</span>
          </button>

          {/* FT-089: Mode Bulan Ini */}
          <button
            type="button"
            onClick={() => handleSelectMode("monthly")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 min-h-[44px] text-sm font-semibold transition-all ${
              activeMode === "monthly"
                ? "bg-primary text-white shadow-xs"
                : "bg-[#F3F4F6] text-[#374151] hover:bg-border hover:text-foreground"
            }`}
          >
            <CalendarRange className="h-4 w-4" />
            <span>Bulan Ini</span>
          </button>

          {/* Mode Kustom */}
          <button
            type="button"
            onClick={() => handleSelectMode("custom")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 min-h-[44px] text-sm font-semibold transition-all ${
              activeMode === "custom"
                ? "bg-primary text-white shadow-xs"
                : "bg-[#F3F4F6] text-[#374151] hover:bg-border hover:text-foreground"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Kustom</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted font-medium">
          <Calendar className="h-4 w-4 text-primary" />
          <span>
            {from === to
              ? formatReportDate(from)
              : `${formatReportDate(from)} — ${formatReportDate(to)}`}
          </span>
        </div>
      </div>

      {/* Filter Form (Always allows selecting Kandang, and allows date inputs if Custom or adjustments) */}
      <form
        onSubmit={handleSubmit}
        className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-[180px_180px_1fr_auto]"
      >
        <div>
          <label
            htmlFor="prod-from"
            className="mb-1.5 block text-sm font-medium text-[#374151]"
          >
            Dari
          </label>
          <input
            id="prod-from"
            type="date"
            max={to || todayStr}
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setMode("custom");
              validate(e.target.value, to);
            }}
            disabled={isPending}
            className="min-h-[44px] h-11 w-full rounded-[10px] border border-border bg-white px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
          />
        </div>

        <div>
          <label
            htmlFor="prod-to"
            className="mb-1.5 block text-sm font-medium text-[#374151]"
          >
            Sampai
          </label>
          <input
            id="prod-to"
            type="date"
            max={todayStr}
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setMode("custom");
              validate(from, e.target.value);
            }}
            disabled={isPending}
            className="min-h-[44px] h-11 w-full rounded-[10px] border border-border bg-white px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
          />
        </div>

        <div>
          <label
            htmlFor="prod-kandang"
            className="mb-1.5 block text-sm font-medium text-[#374151]"
          >
            Filter Kandang
          </label>
          <select
            id="prod-kandang"
            value={kandangId}
            onChange={(e) => setKandangId(e.target.value)}
            disabled={isPending}
            className="min-h-[44px] h-11 w-full rounded-[10px] border border-border bg-white px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
          >
            <option value="">Semua Kandang</option>
            {kandangs.map((k) => (
              <option key={k.id} value={k.id}>
                {k.code} · {k.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2 pt-1 sm:pt-0">
          <Button
            type="submit"
            disabled={isPending || !!validationError}
            className="min-h-[44px] h-11 min-w-28 gap-1.5 text-sm font-semibold"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memuat...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Terapkan</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={handleReset}
            disabled={isPending}
            className="min-h-[44px] h-11 gap-1.5 px-4 text-sm font-medium"
            title="Reset filter ke default Minggu Ini"
          >
            <RotateCcw className="h-3.5 w-3.5 text-muted" />
            <span>Reset</span>
          </Button>
        </div>
      </form>

      {validationError ? (
        <div className="flex items-center gap-2 rounded-lg bg-[#FEF2F2] p-2.5 text-xs text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      ) : null}
    </Card>
  );
}