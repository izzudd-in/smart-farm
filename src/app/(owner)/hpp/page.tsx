import {
  parseDateOnly,
} from "@/features/daily-operations/utils/date";

import {
  parseRoutineCostFilters,
} from "@/features/expenses/schemas/routine-cost";

import {
  HppMonitoring,
} from "@/features/finance/components/hpp-monitoring";

import {
  getProfitForPeriod,
} from "@/features/finance/queries/get-profit";

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
   * Shared period filter untuk:
   * HPP + Revenue + Profit.
   *
   * Parser existing juga memberi
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

  /*
   * Page hanya memanggil Profit engine.
   *
   * getProfitForPeriod() memanggil
   * getHppForPeriod() tepat satu kali.
   */
  const data =
    await getProfitForPeriod(
      parseDateOnly(
        filters.from,
      ),

      parseDateOnly(
        filters.to,
      ),
    );

  return (
    <HppMonitoring
      data={
        data
      }
    />
  );
}