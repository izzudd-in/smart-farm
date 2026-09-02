import type { ProductionReportRow } from "@/features/production/types/production";
import {
  calculateFcr,
  deriveEggProduction,
} from "@/features/production/utils/calculations";
import { getDailyReportStatus } from "@/features/daily-operations/utils/status";

type ProductionReportRecord = {
  id: string;
  date: Date;

  saleableEgg: number | null;
  damagedEgg: number | null;
  feedUsed: number | null;
  mortality: number | null;

  kandang: {
    id: string;
    code: string;
    name: string;
  };

  flock: {
    id: string;
    name: string;
    startDate: Date;
    initialPopulation: number;
  };
};

export function mapProductionReport(
  report: ProductionReportRecord,
): ProductionReportRow {
  const derived =
    deriveEggProduction(
      report.saleableEgg,
      report.damagedEgg,
    );

  const fcr = calculateFcr(
    report.feedUsed,
    derived.totalEgg,
  );

  return {
    id: report.id,

    date: report.date
      .toISOString()
      .slice(0, 10),

    kandangId:
      report.kandang.id,

    kandangCode:
      report.kandang.code,

    kandangName:
      report.kandang.name,

    flockId:
      report.flock.id,

    flockName:
      report.flock.name,

    flockStartDate:
      report.flock.startDate
        .toISOString()
        .slice(0, 10),

    initialPopulation:
      report.flock
        .initialPopulation,

    saleableEgg:
      report.saleableEgg,

    damagedEgg:
      report.damagedEgg,

    totalEgg:
      derived.totalEgg,

    damagedPercentage:
      derived.damagedPercentage,

    feedUsed:
      report.feedUsed,

    fcr,

    henDay: null,

    mortality:
      report.mortality,

    status:
      getDailyReportStatus({
        saleableEgg:
          report.saleableEgg,

        damagedEgg:
          report.damagedEgg,

        feedUsed:
          report.feedUsed,

        mortality:
          report.mortality,
      }),
  };
}