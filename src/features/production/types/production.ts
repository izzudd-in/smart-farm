import type { DailyReportStatus } from "@/features/daily-operations/types/daily-report";

export type ProductionFilters = {
  from: string;
  to: string;
  kandangId: string;
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
};

export type ProductionKpis = {
  totalProduction: number | null;
  saleableEgg: number | null;
  damagedEgg: number | null;
  activePopulation: number | null;
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

  cumulativeMortality: number | null;
  estimatedPopulation: number | null;
  mortalityOnEndDate: number | null;
};

export type ProductionPageData = {
  filters: ProductionFilters;
  kandangOptions: ProductionKandangOption[];

  kpis: ProductionKpis;
  trend: ProductionTrendPoint[];
  kandangs: ProductionKandangSummary[];
  history: ProductionReportRow[];
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
  };

  flockOptions: ProductionFlockOption[];
  selectedFlock: ProductionFlockOption | null;

  totalProduction: number | null;
  saleableEgg: number | null;
  damagedEgg: number | null;
  damagedPercentage: number | null;

  cumulativeMortality: number | null;
  estimatedPopulation: number | null;

  trend: ProductionTrendPoint[];
  history: ProductionReportRow[];
};