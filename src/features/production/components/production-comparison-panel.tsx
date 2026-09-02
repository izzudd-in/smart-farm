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
        currentLegend: "Hari Terpilih (Garis Hijau)",
        previousLegend: "Hari Sebelumnya (Garis Abu-abu)",
      };
    case "weekly":
      return {
        badge: "Mode Minggu Ini (FT-088)",
        title: "Perbandingan Produksi Minggu Ini vs Minggu Sebelumnya",
        chartTitle: "Grafik Produksi Harian Minggu Berjalan vs Minggu Lalu",
        chartDesc: "Menampilkan produksi per hari selama minggu berjalan dan dibandingkan dengan minggu sebelumnya.",
        currentLegend: "Minggu Ini / Aktif (Garis Hijau)",
        previousLegend: "Minggu Sebelumnya (Garis Abu-abu)",
      };
    case "monthly":
      return {
        badge: "Mode Bulan Ini (FT-089)",
        title: "Perbandingan Produksi Bulan Ini vs Bulan Sebelumnya",
        chartTitle: "Grafik Agregasi Mingguan Bulan Ini vs Bulan Lalu",
        chartDesc: "Menampilkan produksi bulan berjalan dibanding bulan sebelumnya dengan agregasi mingguan agar grafik tidak terlalu padat.",
        currentLegend: "Bulan Ini / Aktif (Garis Hijau)",
        previousLegend: "Bulan Sebelumnya (Garis Abu-abu)",
      };
    case "custom":
    default:
      return {
        badge: "Mode Kustom",
        title: "Perbandingan Produksi Periode Aktif vs Periode Sebelumnya",
        chartTitle: "Grafik Komparasi Harian Periode Aktif vs Sebelumnya",
        chartDesc: "Membandingkan total produksi telur harian dalam rentang hari yang bersesuaian.",
        currentLegend: "Periode Aktif (Garis Hijau)",
        previousLegend: "Periode Sebelumnya (Garis Abu-abu)",
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
      unit: "butir",
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

  const hoveredIdx = hoveredDay
    ? trendPoints.findIndex((p) => p.dayIndex === hoveredDay.dayIndex)
    : -1;
  const hoveredX = hoveredIdx >= 0 ? curCoords[hoveredIdx]?.x : null;

  return (
    <Card className="p-5 space-y-5">
      {/* Header & Period Information */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-emerald-600" />
            <h2 className="font-bold text-foreground">
              {modeMeta.title}
            </h2>
            <span className="rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
              {modeMeta.badge}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Formula perubahan: <code className="bg-[#F3F4F6] px-1 py-0.5 rounded text-[#374151]">((Aktif - Sebelumnya) / Sebelumnya) × 100%</code>
          </p>
        </div>

        {/* Period Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 font-medium text-emerald-800">
            {mode === "today" ? <Clock className="h-3.5 w-3.5" /> : <CalendarDays className="h-3.5 w-3.5" />}
            <span>
              Aktif (Hijau): {filters.from === filters.to ? formatReportDate(filters.to) : `${formatReportDate(filters.from)} — ${formatReportDate(filters.to)}`}
            </span>
          </div>

          <ArrowRight className="h-3.5 w-3.5 text-muted" />

          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-[#F9FAFB] px-3 py-1.5 font-medium text-[#4B5563]">
            <CalendarDays className="h-3.5 w-3.5 text-muted" />
            <span>
              Sebelumnya (Abu-abu): {comparison.previousPeriod.from === comparison.previousPeriod.to ? formatReportDate(comparison.previousPeriod.to) : `${formatReportDate(comparison.previousPeriod.from)} — ${formatReportDate(comparison.previousPeriod.to)}`}
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

      {/* Comparison Chart with Green Active Line and Gray Previous Line (UX-021, UX-023) */}
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

          {/* Legend with explicit Green and Gray indicators (UX-021, UX-023) */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-5 rounded-full bg-[#16A34A]" />
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
              aria-label="Grafik perbandingan produksi aktif (hijau) vs pembanding (abu-abu)"
              className="h-44 w-full overflow-visible"
            >
              {/* Grid lines */}
              <line x1="0" y1="6" x2="100" y2="6" stroke="#E5E7EB" strokeWidth="0.4" strokeDasharray="1 1" />
              <line x1="0" y1="20" x2="100" y2="20" stroke="#E5E7EB" strokeWidth="0.4" strokeDasharray="1 1" />
              <line x1="0" y1="34" x2="100" y2="34" stroke="#D1D5DB" strokeWidth="0.5" />

              {/* Guideline when hovering (UX-022) */}
              {hoveredX !== null ? (
                <line
                  x1={hoveredX}
                  y1={4}
                  x2={hoveredX}
                  y2={34}
                  stroke="#16A34A"
                  strokeWidth="0.6"
                  strokeDasharray="1.5 1.5"
                  opacity={0.6}
                />
              ) : null}

              {/* Previous Period Polyline: Garis Abu-abu (UX-021, UX-023) */}
              {prevCoords.length > 1 ? (
                <polyline
                  points={prevPolyline}
                  fill="none"
                  stroke="#9CA3AF"
                  strokeWidth="1.8"
                  strokeDasharray="3 2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              ) : null}

              {/* Current Period Polyline: Garis Hijau (UX-021, UX-023) */}
              {curCoords.length > 1 ? (
                <polyline
                  points={curPolyline}
                  fill="none"
                  stroke="#16A34A"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              ) : null}

              {/* Current Period Points: Garis Hijau */}
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
                      r={isHovered ? "2.6" : "1.5"}
                      fill={isHovered ? "#FFFFFF" : "#16A34A"}
                      stroke="#16A34A"
                      strokeWidth={isHovered ? "1.6" : "0.5"}
                    />
                  </g>
                );
              })}

              {/* Previous Period Points: Garis Abu-abu */}
              {prevCoords.map(({ x, y }, idx) => {
                const point = trendPoints[idx];
                const isHovered = hoveredDay?.dayIndex === point.dayIndex;

                return (
                  <circle
                    key={`prev-${point.dayIndex}`}
                    cx={x}
                    cy={y}
                    r={isHovered ? "2.2" : "1.3"}
                    fill="#9CA3AF"
                    opacity={0.9}
                  />
                );
              })}
            </svg>

            {/* X-Axis labels */}
            <div className="mt-1 flex justify-between gap-2 text-[11px] text-muted">
              {trendPoints.map((point) => (
                <span
                  key={point.dayIndex}
                  className={`cursor-pointer hover:text-foreground transition-colors ${
                    hoveredDay?.dayIndex === point.dayIndex ? "font-bold text-emerald-700" : ""
                  }`}
                  onClick={() => setHoveredDay(point)}
                >
                  {point.dayLabel}
                </span>
              ))}
            </div>

            {/* Detailed Tooltip / Inspection Box (UX-022) */}
            {hoveredDay ? (
              <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50/70 p-3.5 text-xs shadow-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/80 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-foreground">
                      📌 Detail Komparasi: {hoveredDay.dayLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-muted">Perubahan:</span>
                    <ChangeBadge
                      percentage={calculatePercentageChange(
                        hoveredDay.currentValue,
                        hoveredDay.previousValue,
                      )}
                    />
                  </div>
                </div>

                {/* Values Comparison Breakdown (UX-022) */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 pt-1">
                  <div className="rounded-lg bg-white p-2.5 border border-emerald-200 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-muted">
                      <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
                      <span>Periode Aktif ({formatReportDate(hoveredDay.currentDate)})</span>
                    </div>
                    <p className="mt-1 text-base font-bold text-foreground">
                      {formatNumber(hoveredDay.currentValue, "kg")}
                    </p>
                  </div>

                  <div className="rounded-lg bg-white p-2.5 border border-border shadow-2xs">
                    <div className="flex items-center gap-1.5 text-muted">
                      <span className="h-2 w-2 rounded-full bg-[#9CA3AF]" />
                      <span>Periode Pembanding ({formatReportDate(hoveredDay.previousDate)})</span>
                    </div>
                    <p className="mt-1 text-base font-bold text-foreground">
                      {formatNumber(hoveredDay.previousValue, "kg")}
                    </p>
                  </div>

                  <div className="rounded-lg bg-white p-2.5 border border-border shadow-2xs">
                    <div className="flex items-center gap-1.5 text-muted">
                      <span>Selisih Nominal Produksi</span>
                    </div>
                    <p className="mt-1 text-base font-bold text-foreground">
                      {hoveredDay.currentValue !== null && hoveredDay.previousValue !== null ? (
                        <>
                          {hoveredDay.currentValue - hoveredDay.previousValue > 0
                            ? `+${formatter.format(hoveredDay.currentValue - hoveredDay.previousValue)} kg`
                            : `${formatter.format(hoveredDay.currentValue - hoveredDay.previousValue)} kg`}
                        </>
                      ) : (
                        "—"
                      )}
                    </p>
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
