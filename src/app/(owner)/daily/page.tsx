import {
  OwnerDailyFiltersPanel,
} from "@/features/daily-operations/components/owner-daily-filters";
import { OwnerDailyList } from "@/features/daily-operations/components/owner-daily-list";
import { OwnerDailySummary } from "@/features/daily-operations/components/owner-daily-summary";
import { getOwnerDailyData } from "@/features/daily-operations/queries/get-owner-daily";
import { parseOwnerDailyFilters } from "@/features/daily-operations/schemas/owner-daily-filter";
import { formatReportDate } from "@/features/daily-operations/utils/date";

type DailyPageProps = {
  searchParams: Promise<{
    date?: string | string[];
    kandang?: string | string[];
    status?: string | string[];
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

export default async function DailyPage({
  searchParams,
}: DailyPageProps) {
  const params = await searchParams;

  const filters =
    parseOwnerDailyFilters({
      date: firstValue(
        params.date,
      ),

      kandangId: firstValue(
        params.kandang,
      ),

      status: firstValue(
        params.status,
      ),
    });

  const data =
    await getOwnerDailyData(filters);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Operasional
        </h1>

        <p className="mt-1 text-sm text-muted">
          Monitoring Daily Operations ·{" "}
          {formatReportDate(data.date)}
        </p>
      </div>

      <OwnerDailySummary
        summary={data.summary}
      />

      <OwnerDailyFiltersPanel
        filters={data.filters}
        kandangs={
          data.kandangOptions
        }
      />

      <OwnerDailyList
        rows={data.rows}
      />
    </div>
  );
}