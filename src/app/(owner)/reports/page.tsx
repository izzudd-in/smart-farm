import {
  parseDateOnly,
} from "@/features/daily-operations/utils/date";

import {
  parseRoutineCostFilters,
} from "@/features/expenses/schemas/routine-cost";

import {
  ReportSummary,
} from "@/features/reports/components/report-summary";

import {
  getReportSummaryForPeriod,
} from "@/features/reports/queries/get-report-summary";

type ReportsPageProps = {
  searchParams: Promise<{
    from?:
      | string
      | string[];

    to?:
      | string
      | string[];
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

function buildExportHref(
  from: string,
  to: string,
): string {
  const params =
    new URLSearchParams({
      from,
      to,
    });

  return `/reports/export?${params.toString()}`;
}

export default async function ReportsPage({
  searchParams,
}: ReportsPageProps) {
  const params =
    await searchParams;

  const filters =
    parseRoutineCostFilters({
      from:
        firstValue(
          params.from,
        ),

      to:
        firstValue(
          params.to,
        ),
    });

  const from =
    parseDateOnly(
      filters.from,
    );

  const to =
    parseDateOnly(
      filters.to,
    );

  const data =
    await getReportSummaryForPeriod(
      from,
      to,
    );

  return (
    <ReportSummary
      data={data}
      exportHref={buildExportHref(
        data.period.from,
        data.period.to,
      )}
    />
  );
}