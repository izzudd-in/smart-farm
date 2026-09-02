"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import type { ProductionTrendPoint } from "@/features/production/types/production";
import { parseDateOnly } from "@/features/daily-operations/utils/date";

type ProductionTrendProps = {
  points: ProductionTrendPoint[];
};

type MetricKey =
  | "totalProduction"
  | "saleableEgg"
  | "damagedEgg"
  | "feedUsed"
  | "fcr"
  | "henDay"
  | "mortality";

const METRIC_CONFIG: Record<
  MetricKey,
  { label: string; unit: string; color: string; strokeColor: string }
> = {
  totalProduction: {
    label: "Total Produksi",
    unit: "kg",
    color: "#2563EB",
    strokeColor: "stroke-blue-600",
  },
  saleableEgg: {
    label: "Telur Jual",
    unit: "kg",
    color: "#16A34A",
    strokeColor: "stroke-green-600",
  },
  damagedEgg: {
    label: "Telur Rusak",
    unit: "kg",
    color: "#D97706",
    strokeColor: "stroke-amber-600",
  },
  feedUsed: {
    label: "Pakan",
    unit: "kg",
    color: "#9333EA",
    strokeColor: "stroke-purple-600",
  },
  fcr: {
    label: "FCR",
    unit: "",
    color: "#0284C7",
    strokeColor: "stroke-sky-600",
  },
  henDay: {
    label: "Hen-Day",
    unit: "%",
    color: "#0D9488",
    strokeColor: "stroke-teal-600",
  },
  mortality: {
    label: "Mortalitas",
    unit: "ekor",
    color: "#DC2626",
    strokeColor: "stroke-red-600",
  },
};

function formatShortDate(date: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(parseDateOnly(date));
}

export function ProductionTrend({ points }: ProductionTrendProps) {
  const [activeMetric, setActiveMetric] = useState<MetricKey>("totalProduction");
  const [hoveredPoint, setHoveredPoint] = useState<ProductionTrendPoint | null>(null);

  const metricConfig = METRIC_CONFIG[activeMetric];

  // Show all points within the selected period
  const visiblePoints = points;

  const hasAnyData = visiblePoints.some(
    (p) => p[activeMetric] !== null && p[activeMetric] !== undefined,
  );

  if (visiblePoints.length === 0 || !hasAnyData) {
    return (
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <h2 className="font-semibold text-foreground">Trend Produksi</h2>
            <p className="mt-0.5 text-xs text-muted">
              Tren data harian dalam periode terpilih.
            </p>
          </div>

          <div className="flex flex-wrap gap-1">
            {(Object.keys(METRIC_CONFIG) as MetricKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveMetric(key)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeMetric === key
                    ? "bg-primary text-white"
                    : "bg-[#F3F4F6] text-muted hover:bg-border hover:text-foreground"
                }`}
              >
                {METRIC_CONFIG[key].label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Belum ada data {metricConfig.label.toLowerCase()} pada periode ini.
        </p>
      </Card>
    );
  }

  const values = visiblePoints.map((p) => p[activeMetric] ?? 0);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values);
  const avgValue = values.reduce((sum, v) => sum + v, 0) / (values.length || 1);
  const latestValue = visiblePoints[visiblePoints.length - 1]?.[activeMetric] ?? null;

  const coordinates = visiblePoints.map((point, index) => {
    const x =
      visiblePoints.length === 1
        ? 50
        : (index / (visiblePoints.length - 1)) * 96 + 2;

    const value = point[activeMetric] ?? 0;
    // Map value to SVG y between 34 (bottom) and 6 (top)
    const y = 34 - (value / maxValue) * 28;

    return {
      x,
      y,
      point,
      value,
    };
  });

  const polylinePoints = coordinates.map(({ x, y }) => `${x},${y}`).join(" ");

  // Create SVG polygon for area gradient under line
  const areaPolygon = `${coordinates[0].x},34 ` +
    polylinePoints +
    ` ${coordinates[coordinates.length - 1].x},34`;

  return (
    <Card className="min-w-0 p-5">
      {/* Header & Metric Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h2 className="font-semibold text-foreground">Trend Produksi</h2>
          <p className="mt-0.5 text-xs text-muted">
            Menampilkan data harian pada periode terpilih
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex flex-wrap gap-1">
          {(Object.keys(METRIC_CONFIG) as MetricKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setActiveMetric(key);
                setHoveredPoint(null);
              }}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                activeMetric === key
                  ? "bg-primary text-white shadow-xs"
                  : "bg-[#F3F4F6] text-muted hover:bg-border hover:text-foreground"
              }`}
            >
              {METRIC_CONFIG[key].label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Quick Stats Bar */}
      <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-[#F9FAFB] p-2.5 sm:grid-cols-4 text-xs">
        <div>
          <span className="text-muted">Terakhir:</span>{" "}
          <span className="font-semibold text-foreground">
            {latestValue !== null ? latestValue.toLocaleString("id-ID", { maximumFractionDigits: 2 }) : "—"}{" "}
            {metricConfig.unit}
          </span>
        </div>
        <div>
          <span className="text-muted">Rata-rata:</span>{" "}
          <span className="font-semibold text-foreground">
            {avgValue.toLocaleString("id-ID", { maximumFractionDigits: 2 })} {metricConfig.unit}
          </span>
        </div>
        <div>
          <span className="text-muted">Tertinggi:</span>{" "}
          <span className="font-semibold text-foreground">
            {maxValue.toLocaleString("id-ID", { maximumFractionDigits: 2 })} {metricConfig.unit}
          </span>
        </div>
        <div>
          <span className="text-muted">Terendah:</span>{" "}
          <span className="font-semibold text-foreground">
            {minValue.toLocaleString("id-ID", { maximumFractionDigits: 2 })} {metricConfig.unit}
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative mt-5 w-full">
        <svg
          viewBox="0 0 100 38"
          preserveAspectRatio="none"
          role="img"
          aria-label={`Trend ${metricConfig.label}`}
          className="h-44 w-full overflow-visible"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={metricConfig.color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={metricConfig.color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1="6" x2="100" y2="6" stroke="#E5E7EB" strokeWidth="0.4" strokeDasharray="1 1" />
          <line x1="0" y1="20" x2="100" y2="20" stroke="#E5E7EB" strokeWidth="0.4" strokeDasharray="1 1" />
          <line x1="0" y1="34" x2="100" y2="34" stroke="#D1D5DB" strokeWidth="0.5" />

          {/* Area fill */}
          {coordinates.length > 1 ? (
            <polygon points={areaPolygon} fill="url(#areaGradient)" />
          ) : null}

          {/* Polyline */}
          {coordinates.length > 1 ? (
            <polyline
              points={polylinePoints}
              fill="none"
              stroke={metricConfig.color}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}

          {/* Data Points */}
          {coordinates.map(({ x, y, point }) => {
            const isHovered = hoveredPoint?.date === point.date;
            return (
              <g
                key={point.date}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(point)}
                onClick={() => setHoveredPoint(point)}
              >
                {/* Larger invisible circle for touch/hover target */}
                <circle cx={x} cy={y} r="3.5" fill="transparent" />
                {/* Visible dot */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? "2.2" : "1.4"}
                  fill={isHovered ? "#FFFFFF" : metricConfig.color}
                  stroke={metricConfig.color}
                  strokeWidth={isHovered ? "1.2" : "0.5"}
                />
              </g>
            );
          })}
        </svg>

        {/* Date labels at bottom */}
        <div className="mt-1 flex justify-between gap-4 text-[11px] text-muted">
          <span>{formatShortDate(visiblePoints[0].date)}</span>
          {visiblePoints.length > 2 ? (
            <span>{formatShortDate(visiblePoints[Math.floor(visiblePoints.length / 2)].date)}</span>
          ) : null}
          <span>{formatShortDate(visiblePoints[visiblePoints.length - 1].date)}</span>
        </div>

        {/* Hover / Selection Details Card */}
        {hoveredPoint ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary-soft/50 p-2.5 text-xs">
            <span className="font-semibold text-foreground">
              📅 {formatShortDate(hoveredPoint.date)}:
            </span>
            <div className="flex flex-wrap gap-3">
              <span>
                Total: <b>{hoveredPoint.totalProduction?.toLocaleString("id-ID") ?? "—"} kg</b>
              </span>
              <span>
                Jual: <b>{hoveredPoint.saleableEgg?.toLocaleString("id-ID") ?? "—"} kg</b>
              </span>
              <span>
                Rusak: <b>{hoveredPoint.damagedEgg?.toLocaleString("id-ID") ?? "—"} kg</b>
              </span>
              <span>
                Pakan: <b>{hoveredPoint.feedUsed?.toLocaleString("id-ID") ?? "—"} kg</b>
              </span>
              <span>
                FCR: <b>{hoveredPoint.fcr?.toLocaleString("id-ID") ?? "—"}</b>
              </span>
              <span>
                HD: <b>{hoveredPoint.henDay !== null && hoveredPoint.henDay !== undefined ? `${hoveredPoint.henDay}%` : "—"}</b>
              </span>
              <span>
                Mati: <b>{hoveredPoint.mortality ?? 0} ekor</b>
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}