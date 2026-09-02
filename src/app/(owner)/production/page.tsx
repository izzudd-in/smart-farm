import { ProductionFiltersPanel } from "@/features/production/components/production-filters";
import { ProductionHistoryList } from "@/features/production/components/production-history-list";
import { ProductionKandangList } from "@/features/production/components/production-kandang-list";
import { ProductionKpiCards } from "@/features/production/components/production-kpis";
import { ProductionTrend } from "@/features/production/components/production-trend";
import { ProductionEfficiencySection } from "@/features/production/components/production-efficiency-section";
import { ProductionComparisonPanel } from "@/features/production/components/production-comparison-panel";
import { getProductionPageData } from "@/features/production/queries/get-production-page-data";
import { parseProductionFilters } from "@/features/production/schemas/production-filter";
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

      {/* KPI Overview Cards */}
      <ProductionKpiCards kpis={data.kpis} />

      {/* Interactive Date & Kandang Filters Panel */}
      <ProductionFiltersPanel
        filters={data.filters}
        kandangs={data.kandangOptions}
      />

      {/* FT-080 & FT-081: Analisis Efisiensi Pakan (FCR) dan Hen-Day (HD %) */}
      <ProductionEfficiencySection
        kpis={data.kpis}
        comparison={data.comparison}
      />

      {/* FT-084, FT-085, FT-086: Perbandingan dengan Periode Sebelumnya & Dual-Line Chart */}
      <ProductionComparisonPanel
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