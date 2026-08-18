import type {
  ProductionReportRow,
  ProductionTrendPoint,
} from "@/features/production/types/production";

export function deriveEggProduction(
  saleableEgg: number | null,
  damagedEgg: number | null,
): {
  totalEgg: number | null;
  damagedPercentage: number | null;
} {
  if (
    saleableEgg === null ||
    damagedEgg === null
  ) {
    return {
      totalEgg: null,
      damagedPercentage: null,
    };
  }

  const totalEgg =
    saleableEgg + damagedEgg;

  return {
    totalEgg,

    damagedPercentage:
      totalEgg === 0
        ? 0
        : (damagedEgg / totalEgg) *
          100,
  };
}

export function sumNullable(
  values: Array<
    number | null | undefined
  >,
): number | null {
  const validValues = values.filter(
    (value): value is number =>
      value !== null &&
      value !== undefined,
  );

  if (validValues.length === 0) {
    return null;
  }

  return validValues.reduce(
    (total, value) =>
      total + value,
    0,
  );
}

export function calculateEstimatedPopulation(
  initialPopulation: number,
  cumulativeMortality: number,
): number {
  return (
    initialPopulation -
    cumulativeMortality
  );
}

export function calculateDamagedPercentage(
  saleableEgg: number | null,
  damagedEgg: number | null,
): number | null {
  return deriveEggProduction(
    saleableEgg,
    damagedEgg,
  ).damagedPercentage;
}

export function buildProductionTrend(
  rows: ProductionReportRow[],
): ProductionTrendPoint[] {
  const groups = new Map<
    string,
    ProductionReportRow[]
  >();

  for (const row of rows) {
    const current =
      groups.get(row.date) ?? [];

    current.push(row);

    groups.set(row.date, current);
  }

  return Array.from(groups.entries())
    .sort(([dateA], [dateB]) =>
      dateA.localeCompare(dateB),
    )
    .map(([date, reports]) => ({
      date,

      totalProduction:
        sumNullable(
          reports.map(
            (report) =>
              report.totalEgg,
          ),
        ),

      saleableEgg:
        sumNullable(
          reports.map(
            (report) =>
              report.saleableEgg,
          ),
        ),

      damagedEgg:
        sumNullable(
          reports.map(
            (report) =>
              report.damagedEgg,
          ),
        ),
    }));
}