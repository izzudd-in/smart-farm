import { ProductionFiltersPanel } from "@/features/production/components/production-filters";
import { ProductionHistoryList } from "@/features/production/components/production-history-list";
import { ProductionKandangList } from "@/features/production/components/production-kandang-list";
import { ProductionKpiCards } from "@/features/production/components/production-kpis";
import { ProductionTrend } from "@/features/production/components/production-trend";
import { ProductionEfficiencySection } from "@/features/production/components/production-efficiency-section";
import { ProductionComparisonPanel } from "@/features/production/components/production-comparison-panel";
import { ProductionWeeklyInsight } from "@/features/production/components/production-weekly-insight";
import { getProductionPageData } from "@/features/production/queries/get-production-page-data";
import { parseProductionFilters } from "@/features/production/schemas/production-filter";
import { FarmOnboardingEmptyState } from "@/components/ui/farm-onboarding-empty-state";
import { formatReportDate } from "@/features/daily-operations/utils/date";

type ProductionPageProps = {
  searchParams: Promise<{
    from?: string | string[];
    to?: string | string[];
    kandang?: string | string[];
    mode?: string | string[];
  }>;
};

function firstValue(
  value:
    | string
    | string[]
    | undefined,
): string | undefined {
  return Array.isArray(value)
    ? value[0]
    : value;
}

export default async function ProductionPage({
  searchParams,
}: ProductionPageProps) {
  const params = await searchParams;

  const filters = parseProductionFilters({
    from: firstValue(params.from),
    to: firstValue(params.to),
    kandangId: firstValue(params.kandang),
    mode: firstValue(params.mode),
  });

  const data = await getProductionPageData(filters);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Produksi
        </h1>

        <p className="mt-1 text-sm text-muted">
          {formatReportDate(filters.from)} — {formatReportDate(filters.to)}
        </p>
      </div>

      {/* REL-020 / UX-017 / BUG-016: Onboarding empty state untuk farm baru */}
      {data.kandangOptions.length === 0 ? (
        <FarmOnboardingEmptyState
          hasKandangs={false}
          hasFlocks={false}
          hasFormulas={false}
          title="Mulai Setup Peternakan Baru Anda"
          description="Belum ada kandang terdaftar di farm ini. Ikuti panduan langkah demi langkah di bawah untuk memulai pencatatan produksi telur dan monitoring pakan."
        />
      ) : null}

      {/* UX-020: Insight Mingguan langsung saat pertama kali membuka halaman */}
      <ProductionWeeklyInsight
        kpis={data.kpis}
        comparison={data.comparison}
        trend={data.trend}
        from={data.filters.from}
        to={data.filters.to}
      />

      {/* KPI Overview Cards */}
      <ProductionKpiCards kpis={data.kpis} />

      {/* Interactive Date & Kandang Filters Panel */}
      <ProductionFiltersPanel
        key={`filters-${data.filters.mode}-${data.filters.from}-${data.filters.to}-${data.filters.kandangId}`}
        filters={data.filters}
        kandangs={data.kandangOptions}
      />

      {/* FT-080 & FT-081: Analisis Efisiensi Pakan (FCR) dan Hen-Day (HD %) */}
      <ProductionEfficiencySection
        kpis={data.kpis}
        comparison={data.comparison}
      />

      {/* FT-084, FT-085, FT-086, UX-021, UX-022, UX-023: Perbandingan Periode Aktif (Hijau) vs Pembanding (Abu-abu) */}
      <ProductionComparisonPanel
        key={`comparison-${data.filters.mode}-${data.filters.from}-${data.filters.to}-${data.filters.kandangId}`}
        filters={data.filters}
        currentKpis={data.kpis}
        comparison={data.comparison}
      />

      {/* Metric Breakdown Trend Chart */}
      <ProductionTrend points={data.trend} />

      {/* FT-062: Data Produksi Per Kandang */}
      <ProductionKandangList
        kandangs={data.kandangs}
        filters={data.filters}
      />

      {/* History Produksi */}
      <div>
        <h2 className="mb-3 font-semibold text-foreground">
          History Produksi
        </h2>

        <ProductionHistoryList
          rows={data.history}
          filters={data.filters}
        />
      </div>
    </div>
  );
}