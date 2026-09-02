"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Bird,
  Calendar,
  CalendarDays,
  CalendarRange,
  Check,
  CircleCheckBig,
  Clock,
  Egg,
  LayoutGrid,
  Loader2,
  Percent,
  Scale,
  Skull,
  SlidersHorizontal,
  Table2,
  TriangleAlert,
  Wheat,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReportStatusBadge } from "@/features/daily-operations/components/report-status-badge";
import type {
  ProductionKandangDetail as ProductionKandangDetailType,
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

import { ProductionTrend } from "./production-trend";
import { ProductionEfficiencySection } from "./production-efficiency-section";
import { ProductionComparisonPanel } from "./production-comparison-panel";

type ProductionKandangDetailProps = {
  data: ProductionKandangDetailType;
};

const formatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 2,
});

function kg(value: number | null): string {
  return value === null ? "—" : `${formatter.format(value)} kg`;
}

function birds(value: number | null): string {
  return value === null ? "—" : `${formatter.format(value)} ekor`;
}

function getFcrBadge(fcr: number | null) {
  if (fcr === null) return null;
  if (fcr <= 2.2) {
    return {
      label: "Efisien",
      className: "text-[#16A34A] bg-[#DCFCE7]",
    };
  }
  if (fcr <= 2.45) {
    return {
      label: "Normal",
      className: "text-[#CA8A04] bg-[#FEF9C3]",
    };
  }
  return {
    label: "Tinggi",
    className: "text-[#DC2626] bg-[#FEE2E2]",
  };
}

function getHdStatus(hd: number | null) {
  if (hd === null) return null;
  if (hd >= 85) {
    return {
      label: "Puncak",
      className: "text-[#16A34A] bg-[#DCFCE7]",
    };
  }
  if (hd >= 70) {
    return {
      label: "Normal",
      className: "text-primary-hover bg-primary-soft",
    };
  }
  return {
    label: "Rendah",
    className: "text-[#DC2626] bg-[#FEE2E2]",
  };
}

export function ProductionKandangDetailView({
  data,
}: ProductionKandangDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const activeMode: ProductionPeriodMode = data.filters.mode ?? "weekly";
  const [mode, setMode] = useState<ProductionPeriodMode>(activeMode);
  const [from, setFrom] = useState(data.filters.from);
  const [to, setTo] = useState(data.filters.to);
  const [flockId, setFlockId] = useState(data.filters.flockId);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

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

  const applyFilters = (
    newMode: ProductionPeriodMode,
    newFrom: string,
    newTo: string,
    newFlock: string,
  ) => {
    if (!validate(newFrom, newTo)) return;

    const params = new URLSearchParams();
    params.set("mode", newMode);
    params.set("from", newFrom);
    params.set("to", newTo);
    if (newFlock) {
      params.set("flock", newFlock);
    }

    startTransition(() => {
      router.push(`/production/${data.kandang.id}?${params.toString()}`);
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
      newFrom = from;
      return;
    }

    setFrom(newFrom);
    setTo(newTo);
    applyFilters(selectedMode, newFrom, newTo, flockId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(mode, from, to, flockId);
  };

  const backParams = new URLSearchParams({
    from: data.filters.from,
    to: data.filters.to,
    kandang: data.kandang.id,
  });

  const fcrBadge = getFcrBadge(data.fcr);
  const hdStatus = getHdStatus(data.henDay);

  const kpis = [
    {
      label: "Total Produksi",
      value: kg(data.totalProduction),
      subValue: data.damagedPercentage !== null ? `Rusak ${data.damagedPercentage.toFixed(1)}%` : undefined,
      icon: Egg,
      color: "text-primary-hover bg-primary-soft",
    },
    {
      label: "Telur Layak Jual",
      value: kg(data.saleableEgg),
      subValue: data.totalProduction && data.saleableEgg ? `${((data.saleableEgg / data.totalProduction) * 100).toFixed(1)}% total` : undefined,
      icon: CircleCheckBig,
      color: "text-[#15803D] bg-[#DCFCE7]",
    },
    {
      label: "Telur Rusak",
      value: kg(data.damagedEgg),
      subValue: data.damagedPercentage !== null ? `${data.damagedPercentage.toFixed(1)}% dari total` : undefined,
      subValueAlert: (data.damagedPercentage ?? 0) > 3,
      icon: TriangleAlert,
      color: "text-[#B45309] bg-[#FEF3C7]",
    },
    {
      label: "Total Pakan",
      value: kg(data.feedUsed),
      subValue: undefined,
      icon: Wheat,
      color: "text-[#9333EA] bg-[#F3E8FF]",
    },
    {
      label: "FCR Kandang",
      value: data.fcr !== null ? formatter.format(data.fcr) : "—",
      subValue: fcrBadge?.label,
      subValueBadge: fcrBadge?.className,
      icon: Scale,
      color: "text-[#0284C7] bg-[#E0F2FE]",
    },
    {
      label: "Hen-Day (HD %)",
      value: data.henDay !== null ? `${data.henDay}%` : "—",
      subValue: hdStatus ? hdStatus.label : undefined,
      subValueBadge: hdStatus?.className,
      icon: Percent,
      color: "text-[#0D9488] bg-[#CCFBF1]",
    },
    {
      label: "Estimasi Ayam Aktif",
      value: birds(data.estimatedPopulation),
      subValue: undefined,
      icon: Bird,
      color: "text-primary-hover bg-primary-soft",
    },
    {
      label: "Mortalitas Periode",
      value: birds(data.totalMortalityInPeriod),
      subValue: data.cumulativeMortality !== null ? `Kumulatif: ${data.cumulativeMortality} ekor` : undefined,
      subValueAlert: (data.totalMortalityInPeriod ?? 0) > 0,
      icon: Skull,
      color: "text-danger bg-[#FEE2E2]",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Breadcrumb */}
      <div>
        <Link
          href={`/production?${backParams.toString()}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Data Produksi
        </Link>

        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {data.kandang.code} · {data.kandang.name}
          </h1>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-hover">
              {data.selectedFlock ? `Flock: ${data.selectedFlock.name}` : "Belum ada flock"}
            </span>
            {data.selectedFlock?.endedAt ? (
              <span className="rounded-full bg-border px-2.5 py-0.5 text-xs text-muted">
                Selesai
              </span>
            ) : (
              <span className="rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-xs font-semibold text-[#15803D]">
                Aktif
              </span>
            )}
          </div>
        </div>

        <p className="mt-1 text-xs text-muted">
          Populasi Awal: {data.selectedFlock ? `${formatter.format(data.selectedFlock.initialPopulation)} ekor` : "—"} · Dimulai {data.selectedFlock ? formatReportDate(data.selectedFlock.startDate) : "—"}
        </p>
      </div>

      {/* Filter Panel */}
      <Card className="p-4 space-y-3">
        {/* Mode Selection Tabs (FT-087, FT-088, FT-089, FT-090) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-muted mr-1">
              Mode Analisa:
            </span>

            {/* FT-087: Mode Hari Ini */}
            <button
              type="button"
              onClick={() => handleSelectMode("today")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeMode === "today"
                  ? "bg-primary text-white shadow-xs"
                  : "bg-[#F3F4F6] text-[#4B5563] hover:bg-border hover:text-foreground"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Hari Ini</span>
            </button>

            {/* FT-088 & FT-090: Mode Minggu Ini (Default) */}
            <button
              type="button"
              onClick={() => handleSelectMode("weekly")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeMode === "weekly"
                  ? "bg-primary text-white shadow-xs"
                  : "bg-[#F3F4F6] text-[#4B5563] hover:bg-border hover:text-foreground"
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Minggu Ini (Default)</span>
            </button>

            {/* FT-089: Mode Bulan Ini */}
            <button
              type="button"
              onClick={() => handleSelectMode("monthly")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeMode === "monthly"
                  ? "bg-primary text-white shadow-xs"
                  : "bg-[#F3F4F6] text-[#4B5563] hover:bg-border hover:text-foreground"
              }`}
            >
              <CalendarRange className="h-3.5 w-3.5" />
              <span>Bulan Ini</span>
            </button>

            {/* Mode Kustom */}
            <button
              type="button"
              onClick={() => handleSelectMode("custom")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeMode === "custom"
                  ? "bg-primary text-white shadow-xs"
                  : "bg-[#F3F4F6] text-[#4B5563] hover:bg-border hover:text-foreground"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Kustom</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>
              {from === to
                ? formatReportDate(from)
                : `${formatReportDate(from)} — ${formatReportDate(to)}`}
            </span>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[170px_170px_1fr_auto]"
        >
          <div>
            <label
              htmlFor="detail-from"
              className="mb-1.5 block text-xs font-medium text-muted"
            >
              Dari
            </label>
            <input
              id="detail-from"
              type="date"
              max={to || todayStr}
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                validate(e.target.value, to);
              }}
              disabled={isPending}
              className="h-10 w-full rounded-[10px] border border-border bg-white px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="detail-to"
              className="mb-1.5 block text-xs font-medium text-muted"
            >
              Sampai
            </label>
            <input
              id="detail-to"
              type="date"
              max={todayStr}
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                validate(from, e.target.value);
              }}
              disabled={isPending}
              className="h-10 w-full rounded-[10px] border border-border bg-white px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="detail-flock"
              className="mb-1.5 block text-xs font-medium text-muted"
            >
              Flock
            </label>
            <select
              id="detail-flock"
              value={flockId}
              onChange={(e) => setFlockId(e.target.value)}
              disabled={isPending}
              className="h-10 w-full rounded-[10px] border border-border bg-white px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
            >
              {data.flockOptions.map((flock) => (
                <option key={flock.id} value={flock.id}>
                  {flock.name} {flock.endedAt ? "(Selesai)" : "(Aktif)"}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button
              type="submit"
              size="sm"
              disabled={isPending || !!validationError}
              className="w-full lg:w-auto min-w-24 gap-1.5"
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
          </div>
        </form>

        {validationError ? (
          <div className="flex items-center gap-2 rounded-lg bg-[#FEF2F2] p-2.5 text-xs text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        ) : null}
      </Card>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8">
        {kpis.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.label} className="min-w-0 p-3.5 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <span className="truncate text-xs font-medium text-muted">
                  {item.label}
                </span>

                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${item.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>

              <div className="mt-2 min-w-0">
                <p className="truncate text-lg font-bold text-foreground sm:text-xl">
                  {item.value}
                </p>

                {item.subValue ? (
                  <div className="mt-1">
                    {item.subValueBadge ? (
                      <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${item.subValueBadge}`}>
                        {item.subValue}
                      </span>
                    ) : (
                      <span className={`truncate text-[11px] ${item.subValueAlert ? "font-semibold text-danger" : "text-muted"}`}>
                        {item.subValue}
                      </span>
                    )}
                  </div>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>

      {/* FT-080 & FT-081: Analisis Efisiensi Pakan (FCR) dan Hen-Day (HD %) untuk Kandang ini */}
      <ProductionEfficiencySection
        kpis={{
          totalProduction: data.totalProduction,
          saleableEgg: data.saleableEgg,
          damagedEgg: data.damagedEgg,
          damagedPercentage: data.damagedPercentage,
          feedUsed: data.feedUsed,
          fcr: data.fcr,
          henDay: data.henDay,
          activePopulation: data.estimatedPopulation,
          totalMortality: data.totalMortalityInPeriod,
        }}
        comparison={data.comparison}
      />

      {/* FT-084, FT-085, FT-086: Perbandingan Produksi Kandang dengan Periode Sebelumnya & Dual-Line Chart */}
      <ProductionComparisonPanel
        filters={{
          from: data.filters.from,
          to: data.filters.to,
          kandangId: data.kandang.id,
        }}
        currentKpis={{
          totalProduction: data.totalProduction,
          saleableEgg: data.saleableEgg,
          damagedEgg: data.damagedEgg,
          damagedPercentage: data.damagedPercentage,
          feedUsed: data.feedUsed,
          fcr: data.fcr,
          henDay: data.henDay,
          activePopulation: data.estimatedPopulation,
          totalMortality: data.totalMortalityInPeriod,
        }}
        comparison={data.comparison}
      />

      {/* Interactive Trend Chart */}
      <ProductionTrend points={data.trend} />

      {/* History Evaluation Section (FT-063: Tampilkan riwayat produksi lengkap kandang tersebut) */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-foreground">
              Riwayat Produksi Harian Kandang
            </h2>
            <p className="text-xs text-muted">
              Total {data.history.length} data harian tercatat
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-0.5 text-xs">
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

        {data.history.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="font-medium text-foreground">
              Belum ada laporan harian untuk flock ini pada periode terpilih.
            </p>
            <p className="mt-1 text-sm text-muted">
              Pilih rentang tanggal lain atau ganti pilihan flock.
            </p>
          </Card>
        ) : viewMode === "table" ? (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-[#F9FAFB] font-semibold text-[#4B5563]">
                  <tr>
                    <th className="px-3 py-2.5">Tanggal</th>
                    <th className="px-3 py-2.5 text-right">Total Produksi</th>
                    <th className="px-3 py-2.5 text-right">Telur Jual</th>
                    <th className="px-3 py-2.5 text-right">Telur Rusak</th>
                    <th className="px-3 py-2.5 text-right">Pakan</th>
                    <th className="px-3 py-2.5 text-right">FCR</th>
                    <th className="px-3 py-2.5 text-right">HD (%)</th>
                    <th className="px-3 py-2.5 text-right">Mati Hari Ini</th>
                    <th className="px-3 py-2.5 text-right">Mati Kumulatif</th>
                    <th className="px-3 py-2.5 text-right">Est. Ayam Aktif</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.history.map((report) => (
                    <tr key={report.id} className="hover:bg-[#F9FAFB]/75 transition-colors">
                      <td className="whitespace-nowrap px-3 py-2.5 font-medium text-foreground">
                        {formatReportDate(report.date)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-bold text-foreground">
                        {kg(report.totalEgg)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right text-foreground">
                        {kg(report.saleableEgg)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right">
                        <span className={report.damagedPercentage && report.damagedPercentage > 3 ? "font-semibold text-danger" : "text-foreground"}>
                          {kg(report.damagedEgg)}
                        </span>
                        {report.damagedPercentage !== null ? (
                          <span className="ml-1 text-[10px] text-muted">
                            ({report.damagedPercentage.toFixed(1)}%)
                          </span>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right text-foreground">
                        {kg(report.feedUsed)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-medium text-foreground">
                        {report.fcr !== null ? formatter.format(report.fcr) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-medium text-foreground">
                        {report.henDay !== null && report.henDay !== undefined ? `${report.henDay}%` : "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right">
                        <span className={report.mortality && report.mortality > 0 ? "font-semibold text-danger" : "text-muted"}>
                          {report.mortality ?? 0}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right text-muted">
                        {report.cumulativeMortality ?? 0}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-medium text-foreground">
                        {report.estimatedPopulation !== undefined
                          ? formatter.format(report.estimatedPopulation)
                          : "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-center">
                        <ReportStatusBadge status={report.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          /* Card View */
          <div className="space-y-3">
            {data.history.map((report) => (
              <Card key={report.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">
                      {formatReportDate(report.date)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {report.flockName}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <ReportStatusBadge status={report.status} />
                    <p className="text-sm font-bold text-foreground">
                      {kg(report.totalEgg)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 sm:grid-cols-7 text-xs">
                  <div>
                    <span className="text-muted">Telur Jual</span>
                    <p className="mt-0.5 font-medium">{kg(report.saleableEgg)}</p>
                  </div>

                  <div>
                    <span className="text-muted">Telur Rusak</span>
                    <p className="mt-0.5 font-medium">
                      {kg(report.damagedEgg)}{" "}
                      {report.damagedPercentage !== null ? (
                        <span className="text-[10px] text-muted">
                          ({report.damagedPercentage.toFixed(1)}%)
                        </span>
                      ) : null}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted">Pakan & FCR</span>
                    <p className="mt-0.5 font-medium">
                      {kg(report.feedUsed)}{" "}
                      <span className="text-[10px] text-muted">
                        (FCR: {report.fcr !== null ? formatter.format(report.fcr) : "—"})
                      </span>
                    </p>
                  </div>

                  <div>
                    <span className="text-muted">Hen-Day (HD)</span>
                    <p className="mt-0.5 font-bold text-foreground">
                      {report.henDay !== null && report.henDay !== undefined ? `${report.henDay}%` : "—"}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted">Mati Hari Ini</span>
                    <p className={`mt-0.5 font-medium ${report.mortality && report.mortality > 0 ? "font-semibold text-danger" : ""}`}>
                      {report.mortality ?? 0} ekor
                    </p>
                  </div>

                  <div>
                    <span className="text-muted">Mati Kumulatif</span>
                    <p className="mt-0.5 font-medium">
                      {report.cumulativeMortality ?? 0} ekor
                    </p>
                  </div>

                  <div>
                    <span className="text-muted">Est. Ayam Aktif</span>
                    <p className="mt-0.5 font-medium">
                      {report.estimatedPopulation !== undefined
                        ? formatter.format(report.estimatedPopulation)
                        : "—"}{" "}
                      ekor
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}