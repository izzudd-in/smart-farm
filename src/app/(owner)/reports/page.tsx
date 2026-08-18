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
  return Array.isArray(
    value,
  )
    ? value[0]
    : value;
}

export default async function ReportsPage({
  searchParams,
}: ReportsPageProps) {
  const params =
    await searchParams;

  /*
   * Reuse parser yang sama dengan
   * Expenses/HPP:
   * default bulan berjalan Asia/Jakarta.
   */
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

  const data =
    await getReportSummaryForPeriod(
      parseDateOnly(
        filters.from,
      ),

      parseDateOnly(
        filters.to,
      ),
    );

  return (
    <ReportSummary
      data={
        data
      }
    />
  );
}