import {
  ArrowDownRight,
  ArrowUpRight,
  Bird,
  CheckCircle2,
  Egg,
  Scale,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import type {
  ProductionComparison,
  ProductionKpis,
  ProductionTrendPoint,
} from "@/features/production/types/production";
import { formatReportDate } from "@/features/daily-operations/utils/date";

type ProductionWeeklyInsightProps = {
  kpis: ProductionKpis;
  comparison: ProductionComparison;
  trend: ProductionTrendPoint[];
  from: string;
  to: string;
};

const formatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 2,
});

export function ProductionWeeklyInsight({
  kpis,
  comparison,
  trend,
  from,
  to,
}: ProductionWeeklyInsightProps) {
  const prodChange = comparison.changes.totalProduction;
  const isPositive = (prodChange ?? 0) >= 0;

  // Find peak day in the period
  let peakDay: ProductionTrendPoint | null = null;
  for (const point of trend) {
    if (!peakDay || (point.totalProduction ?? 0) > (peakDay.totalProduction ?? 0)) {
      peakDay = point;
    }
  }

  return (
    <Card className="p-4 bg-gradient-to-r from-emerald-50/50 via-white to-sky-50/40 border-emerald-200/60 shadow-xs space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Insight Produksi Mingguan
            </h2>
            <p className="text-[11px] text-muted">
              Evaluasi performa operasional minggu berjalan vs minggu sebelumnya
            </p>
          </div>
        </div>

        <span className="rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
          Minggu Ini · {formatReportDate(from)} — {formatReportDate(to)}
        </span>
      </div>

      {/* 4 Insight Highlights */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Highlight 1: Produksi & Growth */}
        <div className="rounded-xl border border-border/80 bg-white p-3 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Egg className="h-3.5 w-3.5 text-emerald-600" />
            <span className="font-medium">Total Produksi</span>
          </div>
          <p className="mt-1 text-lg font-bold text-foreground">
            {kpis.totalProduction !== null
              ? `${formatter.format(kpis.totalProduction)} kg`
              : "—"}
          </p>
          {prodChange !== null ? (
            <div
              className={`mt-0.5 flex items-center gap-0.5 text-xs font-semibold ${
                isPositive ? "text-emerald-600" : "text-danger"
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              <span>{isPositive ? `+${prodChange}%` : `${prodChange}%`} vs minggu lalu</span>
            </div>
          ) : (
            <p className="mt-0.5 text-[11px] text-muted">Minggu pertama terpantau</p>
          )}
        </div>

        {/* Highlight 2: Puncak Produksi */}
        <div className="rounded-xl border border-border/80 bg-white p-3 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
            <span className="font-medium">Hari Puncak</span>
          </div>
          <p className="mt-1 text-lg font-bold text-foreground">
            {peakDay?.totalProduction !== null && peakDay?.totalProduction !== undefined
              ? `${formatter.format(peakDay.totalProduction)} kg`
              : "—"}
          </p>
          <p className="mt-0.5 text-xs text-muted truncate">
            {peakDay ? formatReportDate(peakDay.date) : "Belum ada data"}
          </p>
        </div>

        {/* Highlight 3: Efisiensi Pakan (FCR) */}
        <div className="rounded-xl border border-border/80 bg-white p-3 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Scale className="h-3.5 w-3.5 text-purple-600" />
            <span className="font-medium">FCR Mingguan</span>
          </div>
          <p className="mt-1 text-lg font-bold text-foreground">
            {kpis.fcr !== null ? formatter.format(kpis.fcr) : "—"}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {kpis.fcr !== null
              ? kpis.fcr <= 2.2
                ? "Konversi pakan sangat efisien"
                : kpis.fcr <= 2.45
                  ? "Standar pakan normal"
                  : "Perlu evaluasi pakan"
              : "Menunggu laporan"}
          </p>
        </div>

        {/* Highlight 4: Hen-Day (HD %) */}
        <div className="rounded-xl border border-border/80 bg-white p-3 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Bird className="h-3.5 w-3.5 text-teal-600" />
            <span className="font-medium">Hen-Day (HD)</span>
          </div>
          <p className="mt-1 text-lg font-bold text-foreground">
            {kpis.henDay !== null ? `${kpis.henDay}%` : "—"}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {kpis.henDay !== null
              ? kpis.henDay >= 85
                ? "Performa puncak flock"
                : kpis.henDay >= 70
                  ? "Produksi stabil"
                  : "Perlu perhatian medis"
              : "Menunggu laporan"}
          </p>
        </div>
      </div>

      {/* Summary Sentence */}
      <div className="flex items-center gap-2 rounded-lg bg-white/80 p-2.5 text-xs text-foreground border border-border/40">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
        <span>
          Aktivitas produksi harian telah dirangkum dalam siklus mingguan.{" "}
          {prodChange !== null ? (
            isPositive ? (
              <b>Produksi mengalami kenaikan sebesar {prodChange}% dibanding minggu sebelumnya.</b>
            ) : (
              <b>Produksi mengalami penurunan sebesar {Math.abs(prodChange)}% dibanding minggu sebelumnya.</b>
            )
          ) : (
            <span>Pantau tren harian untuk mengevaluasi konsistensi produksi telur.</span>
          )}
        </span>
      </div>
    </Card>
  );
}
