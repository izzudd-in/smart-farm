export type HppStatus =
  | "READY"
  | "PROVISIONAL"
  | "NO_PRODUCTION"
  | "MISSING_FEED_COST";

export type DailyHppBreakdown = {
  date: string;

  productionKg: string;

  feedCost:
    | string
    | null;

  routineCost: string;
  dailyExpenseCost: string;

  totalCost:
    | string
    | null;

  hppPerKg:
    | string
    | null;

  status: HppStatus;

  warnings: string[];
};

export type HppPeriodResult = {
  from: string;
  to: string;

  productionKg: string;

  feedCost:
    | string
    | null;

  routineCost: string;
  dailyExpenseCost: string;

  totalOperationalCost:
    | string
    | null;

  hppPerKg:
    | string
    | null;

  status: HppStatus;

  warnings: string[];

  incompleteReportCount: number;
  missingFeedCostReportCount: number;

  daily: DailyHppBreakdown[];
};