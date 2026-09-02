"use client";

import { useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Clock,
  GitCompare,
  Minus,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import type {
  ProductionComparison,
  ProductionFilters,
  ProductionKpis,
  ProductionPeriodMode,
  TrendComparisonPoint,
} from "@/features/production/types/production";
import { formatReportDate } from "@/features/daily-operations/utils/date";

type ProductionComparisonPanelProps = {
  filters: ProductionFilters;
  currentKpis: ProductionKpis;
  comparison: ProductionComparison;
};

const formatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 2,
});

function formatNumber(value: number | null, unit = ""): string {
  if (value === null) return "—";
  return `${formatter.format(value)}${unit ? ` ${unit}` : ""}`;
}

function ChangeBadge({
  percentage,
  invertColor = false,
}: {
  percentage: number | null;
  invertColor?: boolean; // If true, positive is bad (e.g. mortality, damaged, FCR)
}) {
  if (percentage === null) {
    return <span className="text-xs text-muted">—</span>;
  }

  const isPositive = percentage > 0;
  const isZero = percentage === 0;

  const isFavorable = invertColor ? !isPositive : isPositive;

  const colorClass = isZero
    ? "text-muted bg-[#F3F4F6]"
    : isFavorable
      ? "text-[#15803D] bg-[#DCFCE7]"
      : "text-danger bg-[#FEE2E2]";

  const Icon = isZero ? Minus : isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-bold ${colorClass}`}
    >
      <Icon className="h-3 w-3" />
      <span>{isPositive ? `+${percentage}%` : `${percentage}%`}</span>
    </span>
  );
}

function getModeMeta(mode: ProductionPeriodMode) {
  switch (mode) {
    case "today":
      return {
        badge: "Mode Hari Ini (FT-087)",
        title: "Perbandingan Produksi Tanggal Terpilih vs Hari Sebelumnya",
        chartTitle: "Line Chart Produksi: Hari Sebelumnya vs Hari Terpilih",
        chartDesc: "Membandingkan total produksi tanggal terpilih dengan hari sebelumnya.",
        currentLegend: "Hari Terpilih (Hari Ini)",
        previousLegend: "Hari Sebelumnya (Kemarin)",
      };
    case "weekly":
      return {
        badge: "Mode Minggu Ini (FT-088)",
        title: "Perbandingan Produksi Minggu Ini vs Minggu Sebelumnya",
        chartTitle: "Grafik Produksi Harian Minggu Berjalan vs Minggu Lalu",
        chartDesc: "Menampilkan produksi per hari selama minggu berjalan dan dibandingkan dengan minggu sebelumnya.",
        currentLegend: "Minggu Ini (Berjalan)",
        previousLegend: "Minggu Sebelumnya",
      };
    case "monthly":
      return {
        badge: "Mode Bulan Ini (FT-089)",
        title: "Perbandingan Produksi Bulan Ini vs Bulan Sebelumnya",
        chartTitle: "Grafik Agregasi Mingguan Bulan Ini vs Bulan Lalu",
        chartDesc: "Menampilkan produksi bulan berjalan dibanding bulan sebelumnya dengan agregasi mingguan agar grafik tidak terlalu padat.",
        currentLegend: "Bulan Ini",
        previousLegend: "Bulan Sebelumnya",
      };
    case "custom":
    default:
      return {
        badge: "Mode Kustom",
        title: "Perbandingan Produksi Periode Aktif vs Periode Sebelumnya",
        chartTitle: "Grafik Komparasi Harian Periode Aktif vs Sebelumnya",
        chartDesc: "Membandingkan total produksi telur harian dalam rentang hari yang bersesuaian.",
        currentLegend: "Periode Aktif",
        previousLegend: "Periode Sebelumnya",
      };
  }
}

export function ProductionComparisonPanel({
  filters,
  currentKpis,
  comparison,
}: ProductionComparisonPanelProps) {
  const [hoveredDay, setHoveredDay] = useState<TrendComparisonPoint | null>(null);

  const mode = comparison.mode ?? filters.mode ?? "weekly";
  const modeMeta = getModeMeta(mode);

  const prev = comparison.previousKpis;
  const changes = comparison.changes;
  const trendPoints = comparison.trendComparison;

  // Determine SVG coordinates for comparison chart
  const currentValues = trendPoints.map((p) => p.currentValue ?? 0);
  const prevValues = trendPoints.map((p) => p.previousValue ?? 0);
  const maxVal = Math.max(...currentValues, ...prevValues, 1);

  const pointsCount = trendPoints.length;

  const getCoordinates = (values: number[]) => {
    return values.map((val, idx) => {
      let x = 50;
      if (pointsCount === 2) {
        // Mode Hari Ini (Kemarin & Hari Ini)
        x = idx === 0 ? 25 : 75;
      } else if (pointsCount > 1) {
        x = (idx / (pointsCount - 1)) * 92 + 4;
      }
      const y = 33 - (val / maxVal) * 26;
      return { x, y, val };
    });
  };

  const curCoords = getCoordinates(currentValues);
  const prevCoords = getCoordinates(prevValues);

  const curPolyline = curCoords.map((c) => `${c.x},${c.y}`).join(" ");
  const prevPolyline = prevCoords.map((c) => `${c.x},${c.y}`).join(" ");

  const comparisonMetrics = [
    {
      label: "Total Produksi",
      current: currentKpis.totalProduction,
      previous: prev.totalProduction,
      change: changes.totalProduction,
      unit: "kg",
      invertColor: false,
    },
    {
      label: "Telur Layak Jual",
      current: currentKpis.saleableEgg,
      previous: prev.saleableEgg,
      change: changes.saleableEgg,
      unit: "kg",
      invertColor: false,
    },
    {
      label: "Telur Rusak",
      current: currentKpis.damagedEgg,
      previous: prev.damagedEgg,
      change: changes.damagedEgg,
      unit: "kg",
      invertColor: true,
    },
    {
      label: "Pakan Digunakan",
      current: currentKpis.feedUsed,
      previous: prev.feedUsed,
      change: changes.feedUsed,
      unit: "kg",
      invertColor: false,
    },
    {
      label: "FCR",
      current: currentKpis.fcr,
      previous: prev.fcr,
      change: changes.fcr,
      unit: "",
      invertColor: true,
    },
    {
      label: "Hen-Day (HD %)",
      current: currentKpis.henDay,
      previous: prev.henDay,
      change: changes.henDay,
      unit: "%",
      invertColor: false,
    },
    {
      label: "Mortalitas",
      current: currentKpis.totalMortality,
      previous: prev.totalMortality,
      change: changes.totalMortality,
      unit: "ekor",
      invertColor: true,
    },
  ];

  return (
    <Card className="p-5 space-y-5">
      {/* Header & Period Information */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-foreground">
              {modeMeta.title}
            </h2>
            <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-semibold text-primary-hover">
              {modeMeta.badge}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Formula perubahan: <code className="bg-[#F3F4F6] px-1 py-0.5 rounded text-[#374151]">((Aktif - Sebelumnya) / Sebelumnya) × 100%</code>
          </p>
        </div>

        {/* Period Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary-soft px-3 py-1.5 font-medium text-primary-hover">
            {mode === "today" ? <Clock className="h-3.5 w-3.5" /> : <CalendarDays className="h-3.5 w-3.5" />}
            <span>
              Aktif: {filters.from === filters.to ? formatReportDate(filters.to) : `${formatReportDate(filters.from)} — ${formatReportDate(filters.to)}`}
            </span>
          </div>

          <ArrowRight className="h-3.5 w-3.5 text-muted" />

          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-[#F9FAFB] px-3 py-1.5 font-medium text-[#4B5563]">
            <CalendarDays className="h-3.5 w-3.5 text-muted" />
            <span>
              Sebelumnya: {comparison.previousPeriod.from === comparison.previousPeriod.to ? formatReportDate(comparison.previousPeriod.to) : `${formatReportDate(comparison.previousPeriod.from)} — ${formatReportDate(comparison.previousPeriod.to)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Comparison Grid (FT-085) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {comparisonMetrics.map((item) => {
          const delta =
            item.current !== null && item.previous !== null
              ? item.current - item.previous
              : null;

          return (
            <div
              key={item.label}
              className="rounded-xl border border-border bg-[#F9FAFB]/50 p-3 flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-muted">
                  {item.label}
                </span>

                <div className="mt-1.5 flex items-baseline justify-between gap-1">
                  <span className="text-lg font-bold text-foreground">
                    {formatNumber(item.current, item.unit)}
                  </span>
                  <ChangeBadge
                    percentage={item.change}
                    invertColor={item.invertColor}
                  />
                </div>
              </div>

              <div className="mt-2 border-t border-border pt-2 text-[10px] text-muted space-y-0.5">
                <div>
                  Sebelum: <b>{formatNumber(item.previous, item.unit)}</b>
                </div>
                <div>
                  Selisih:{" "}
                  <span className={delta !== null && delta !== 0 ? "font-semibold text-foreground" : ""}>
                    {delta !== null ? (delta > 0 ? `+${formatter.format(delta)}` : formatter.format(delta)) : "—"}{" "}
                    {item.unit}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Chart (FT-086, FT-087, FT-088, FT-089) */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {modeMeta.chartTitle}
            </h3>
            <p className="text-xs text-muted">
              {modeMeta.chartDesc}
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-5 rounded-full bg-[#2563EB]" />
              <span className="font-semibold text-foreground">{modeMeta.currentLegend}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-5 rounded-full border border-dashed border-[#9CA3AF] bg-[#D1D5DB]" />
              <span className="text-muted">{modeMeta.previousLegend}</span>
            </div>
          </div>
        </div>

        {trendPoints.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted">
            Belum ada data laporan harian untuk dikomparasikan.
          </p>
        ) : (
          <div className="relative mt-3 w-full">
            <svg
              viewBox="0 0 100 38"
              preserveAspectRatio="none"
              role="img"
              aria-label="Grafik perbandingan produksi"
              className="h-44 w-full overflow-visible"
            >
              {/* Grid lines */}
              <line x1="0" y1="6" x2="100" y2="6" stroke="#E5E7EB" strokeWidth="0.4" strokeDasharray="1 1" />
              <line x1="0" y1="20" x2="100" y2="20" stroke="#E5E7EB" strokeWidth="0.4" strokeDasharray="1 1" />
              <line x1="0" y1="34" x2="100" y2="34" stroke="#D1D5DB" strokeWidth="0.5" />

              {/* Previous Period Polyline (Dashed) */}
              {prevCoords.length > 1 ? (
                <polyline
                  points={prevPolyline}
                  fill="none"
                  stroke="#9CA3AF"
                  strokeWidth="1.6"
                  strokeDasharray="3 2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              ) : null}

              {/* Current Period Polyline (Solid) */}
              {curCoords.length > 1 ? (
                <polyline
                  points={curPolyline}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              ) : null}

              {/* Current Period Points */}
              {curCoords.map(({ x, y }, idx) => {
                const point = trendPoints[idx];
                const isHovered = hoveredDay?.dayIndex === point.dayIndex;

                return (
                  <g
                    key={`cur-${point.dayIndex}`}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredDay(point)}
                    onClick={() => setHoveredDay(point)}
                  >
                    <circle cx={x} cy={y} r="3.5" fill="transparent" />
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? "2.4" : "1.4"}
                      fill={isHovered ? "#FFFFFF" : "#2563EB"}
                      stroke="#2563EB"
                      strokeWidth={isHovered ? "1.4" : "0.5"}
                    />
                  </g>
                );
              })}

              {/* Previous Period Points */}
              {prevCoords.map(({ x, y }, idx) => {
                const point = trendPoints[idx];
                const isHovered = hoveredDay?.dayIndex === point.dayIndex;

                return (
                  <circle
                    key={`prev-${point.dayIndex}`}
                    cx={x}
                    cy={y}
                    r={isHovered ? "2" : "1.2"}
                    fill="#9CA3AF"
                    opacity={0.8}
                  />
                );
              })}
            </svg>

            {/* X-Axis labels */}
            <div className="mt-1 flex justify-between gap-2 text-[11px] text-muted">
              {trendPoints.map((point) => (
                <span
                  key={point.dayIndex}
                  className={`cursor-pointer hover:text-foreground ${
                    hoveredDay?.dayIndex === point.dayIndex ? "font-bold text-primary" : ""
                  }`}
                  onClick={() => setHoveredDay(point)}
                >
                  {point.dayLabel}
                </span>
              ))}
            </div>

            {/* Day/Interval Inspection Details Box */}
            {hoveredDay ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary-soft/60 p-3 text-xs">
                <span className="font-bold text-foreground">
                  📌 {hoveredDay.dayLabel}:
                </span>

                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <span className="text-muted">
                      {modeMeta.currentLegend} ({formatReportDate(hoveredDay.currentDate)}):
                    </span>{" "}
                    <b>{formatNumber(hoveredDay.currentValue, "kg")}</b>
                  </div>

                  <div>
                    <span className="text-muted">
                      {modeMeta.previousLegend} ({formatReportDate(hoveredDay.previousDate)}):
                    </span>{" "}
                    <b>{formatNumber(hoveredDay.previousValue, "kg")}</b>
                  </div>

                  <div>
                    <span className="text-muted">Perubahan:</span>{" "}
                    <ChangeBadge
                      percentage={calculatePercentageChange(
                        hoveredDay.currentValue,
                        hoveredDay.previousValue,
                      )}
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Card>
  );
}

function calculatePercentageChange(
  current: number | null | undefined,
  previous: number | null | undefined,
): number | null {
  if (
    current === null ||
    current === undefined ||
    previous === null ||
    previous === undefined ||
    previous === 0
  ) {
    return null;
  }
  const change = ((current - previous) / Math.abs(previous)) * 100;
  return Number(change.toFixed(1));
}
