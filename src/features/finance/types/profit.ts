import type {
  HppPeriodResult,
} from "@/features/finance/types/hpp";

export type ProfitStatus =
  | "READY"
  | "PROVISIONAL"
  | "MISSING_COST"
  | "NO_REVENUE";

export type ProfitPeriodResult = {
  from: string;
  to: string;

  revenue: string;
  soldKg: string;
  orderCount: number;

  averageSellingPricePerKg:
    | string
    | null;

  estimatedOperationalProfit:
    | string
    | null;

  operationalMarginPercent:
    | string
    | null;

  status: ProfitStatus;

  warnings: string[];

  hasProductionSalesTimingDifference:
    boolean;

  hpp: HppPeriodResult;
};