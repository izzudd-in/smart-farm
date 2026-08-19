import type {
  ProfitStatus,
} from "@/features/finance/types/profit";

export type DashboardProductionToday = {
  saleableEggKg: string;

  completeReports: number;
  incompleteReports: number;
  notStartedReports: number;
  expectedReports: number;

  isFinal: boolean;
};

export type DashboardSalesToday = {
  revenue: string;
  soldKg: string;
  orderCount: number;
};

export type DashboardEggStock = {
  currentStockKg: string;
  isNegative: boolean;
};

export type DashboardProfitMonthToDate = {
  estimatedOperationalProfit:
    | string
    | null;

  operationalMarginPercent:
    | string
    | null;

  hppPerKg:
    | string
    | null;

  status: ProfitStatus;
};

export type DashboardActiveEggPrice = {
  pricePerKg: string;
  effectiveAt: string;
};

export type DashboardDataQuality = {
  completeReportsToday: number;
  incompleteReportsToday: number;
  notStartedReportsToday: number;
  expectedReportsToday: number;

  profitStatus: ProfitStatus;

  missingFeedCostReportsMonthToDate:
    number;
};

export type DashboardOverview = {
  today: string;

  monthToDate: {
    from: string;
    to: string;
  };

  productionToday:
    DashboardProductionToday;

  salesToday:
    DashboardSalesToday;

  eggStock:
    DashboardEggStock;

  estimatedProfitMonthToDate:
    DashboardProfitMonthToDate;

  activeEggPrice:
    | DashboardActiveEggPrice
    | null;

  dataQuality:
    DashboardDataQuality;
};