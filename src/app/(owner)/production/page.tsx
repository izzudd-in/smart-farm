import { ProductionFiltersPanel } from "@/features/production/components/production-filters";
import { ProductionHistoryList } from "@/features/production/components/production-history-list";
import { ProductionKandangList } from "@/features/production/components/production-kandang-list";
import { ProductionKpiCards } from "@/features/production/components/production-kpis";
import { ProductionTrend } from "@/features/production/components/production-trend";
import { getProductionPageData } from "@/features/production/queries/get-production-page-data";
import { parseProductionFilters } from "@/features/production/schemas/production-filter";
import { formatReportDate } from "@/features/daily-operations/utils/date";

type ProductionPageProps = {
  searchParams: Promise<{
    from?: string | string[];
    to?: string | string[];
    kandang?: string | string[];
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
  const params =
    await searchParams;

  const filters =
    parseProductionFilters({
      from: firstValue(
        params.from,
      ),

      to: firstValue(
        params.to,
      ),

      kandangId: firstValue(
        params.kandang,
      ),
    });

  const data =
    await getProductionPageData(
      filters,
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Produksi
        </h1>

        <p className="mt-1 text-sm text-muted">
          {formatReportDate(
            filters.from,
          )}{" "}
          —{" "}
          {formatReportDate(
            filters.to,
          )}
        </p>
      </div>

      <ProductionKpiCards
        kpis={data.kpis}
      />

      <ProductionFiltersPanel
        filters={data.filters}
        kandangs={
          data.kandangOptions
        }
      />

      <ProductionTrend
        points={data.trend}
      />

      <ProductionKandangList
        kandangs={data.kandangs}
        filters={data.filters}
      />

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