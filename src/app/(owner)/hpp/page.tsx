import {
  parseDateOnly,
} from "@/features/daily-operations/utils/date";

import {
  HppMonitoring,
} from "@/features/finance/components/hpp-monitoring";

import {
  getHppForPeriod,
} from "@/features/finance/queries/get-hpp";

import {
  parseRoutineCostFilters,
} from "@/features/expenses/schemas/routine-cost";

type HppPageProps = {
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

export default async function HppPage({
  searchParams,
}: HppPageProps) {
  const params =
    await searchParams;

  /*
   * Existing Routine Cost filter parser
   * sudah menyediakan default bulan berjalan
   * dengan Asia/Jakarta.
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
    await getHppForPeriod(
      parseDateOnly(
        filters.from,
      ),

      parseDateOnly(
        filters.to,
      ),
    );

  return (
    <HppMonitoring
      data={data}
    />
  );
}