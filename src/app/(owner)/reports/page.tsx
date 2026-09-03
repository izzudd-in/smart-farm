import {
  parseDateOnly,
} from "@/features/daily-operations/utils/date";

import {
  ReportSummary,
} from "@/features/reports/components/report-summary";

import {
  getReportSummaryForPeriod,
} from "@/features/reports/queries/get-report-summary";

import {
  parseReportFilters,
} from "@/features/reports/schemas/report-filter";

type ReportsPageProps = {
  searchParams: Promise<{
    from?:
      | string
      | string[];

    to?:
      | string
      | string[];

    preset?:
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
    parseReportFilters({
      from:
        firstValue(
          params.from,
        ),

      to:
        firstValue(
          params.to,
        ),

      preset:
        firstValue(
          params.preset,
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
      preset={filters.preset}
      exportHref={buildExportHref(
        data.period.from,
        data.period.to,
      )}
    />
  );
}