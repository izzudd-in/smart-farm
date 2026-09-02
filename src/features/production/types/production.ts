import type { DailyReportStatus } from "@/features/daily-operations/types/daily-report";

export type ProductionPeriodMode = "today" | "weekly" | "monthly" | "custom";

export type ProductionFilters = {
  from: string;
  to: string;
  kandangId: string;
  mode?: ProductionPeriodMode;
};

export type ProductionKandangOption = {
  id: string;
  code: string;
  name: string;
};

export type ProductionReportRow = {
  id: string;
  date: string;

  kandangId: string;
  kandangCode: string;
  kandangName: string;

  flockId: string;
  flockName: string;
  flockStartDate: string;
  initialPopulation: number;

  saleableEgg: number | null;
  damagedEgg: number | null;
  totalEgg: number | null;
  damagedPercentage: number | null;

  feedUsed: number | null;
  fcr: number | null;
  henDay: number | null; // Hen-Day Production (%)

  mortality: number | null;
  status: DailyReportStatus;

  cumulativeMortality?: number;
  estimatedPopulation?: number;
};

export type ProductionTrendPoint = {
  date: string;
  totalProduction: number | null;
  saleableEgg: number | null;
  damagedEgg: number | null;
  feedUsed: number | null;
  mortality: number | null;
  fcr: number | null;
  henDay: number | null;
};

export type ProductionKpis = {
  totalProduction: number | null;
  saleableEgg: number | null;
  damagedEgg: number | null;
  damagedPercentage: number | null;
  feedUsed: number | null;
  fcr: number | null;
  henDay: number | null; // Hen-Day Production (%)
  activePopulation: number | null;
  totalMortality: number | null;
};

export type ProductionKandangSummary = {
  kandangId: string;
  kandangCode: string;
  kandangName: string;

  flockId: string | null;
  flockName: string | null;

  reportCount: number;

  totalProduction: number | null;
  saleableEgg: number | null;
  damagedEgg: number | null;
  damagedPercentage: number | null;

  feedUsed: number | null;
  fcr: number | null;
  henDay: number | null;

  cumulativeMortality: number | null;
  estimatedPopulation: number | null;
  mortalityInPeriod: number | null;
  mortalityOnEndDate: number | null;
};

export type TrendComparisonPoint = {
  dayIndex: number;
  dayLabel: string;
  currentDate: string;
  currentValue: number | null;
  previousDate: string;
  previousValue: number | null;
};

export type ProductionComparison = {
  mode: ProductionPeriodMode;
  previousPeriod: {
    from: string;
    to: string;
  };
  previousKpis: ProductionKpis;
  changes: {
    totalProduction: number | null; // ((current - prev) / prev) * 100%
    saleableEgg: number | null;
    damagedEgg: number | null;
    feedUsed: number | null;
    fcr: number | null;
    henDay: number | null;
    totalMortality: number | null;
  };
  trendComparison: TrendComparisonPoint[];
};

export type ProductionPageData = {
  filters: ProductionFilters;
  kandangOptions: ProductionKandangOption[];

  kpis: ProductionKpis;
  trend: ProductionTrendPoint[];
  kandangs: ProductionKandangSummary[];
  history: ProductionReportRow[];
  comparison: ProductionComparison;
};

export type ProductionFlockOption = {
  id: string;
  name: string;
  startDate: string;
  endedAt: string | null;
  initialPopulation: number;
};

export type ProductionKandangDetail = {
  kandang: {
    id: string;
    code: string;
    name: string;
  };

  filters: {
    from: string;
    to: string;
    flockId: string;
    mode?: ProductionPeriodMode;
  };

  flockOptions: ProductionFlockOption[];
  selectedFlock: ProductionFlockOption | null;

  totalProduction: number | null;
  saleableEgg: number | null;
  damagedEgg: number | null;
  damagedPercentage: number | null;

  feedUsed: number | null;
  fcr: number | null;
  henDay: number | null;

  totalMortalityInPeriod: number | null;
  cumulativeMortality: number | null;
  estimatedPopulation: number | null;

  trend: ProductionTrendPoint[];
  history: ProductionReportRow[];
  comparison: ProductionComparison;
};