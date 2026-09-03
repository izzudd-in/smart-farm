import type {
  DailyReportStatus,
} from "@/features/daily-operations/types/daily-report";

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

export type DashboardAlertSeverity =
  | "CRITICAL"
  | "WARNING"
  | "INFO";

export type DashboardAlertType =
  | "EGG_STOCK"
  | "FEED_STOCK"
  | "MORTALITY"
  | "OPERATIONS"
  | "COST"
  | "PRICE"
  | "GENERAL";

export type DashboardAlert = {
  id: string;

  severity:
    DashboardAlertSeverity;

  type?:
    DashboardAlertType;

  title: string;
  description: string;

  href?: string;
  actionLabel?: string;
};

export type DashboardKandangToday = {
  kandangId: string;
  kandangName: string;
  flockName: string;

  reportStatus:
    DailyReportStatus;

  operatorName:
    | string
    | null;

  saleableEggKg:
    | string
    | null;

  feedUsedKg:
    | string
    | null;

  mortality:
    | number
    | null;

  reportId:
    | string
    | null;
};

export type DashboardProductionTrendPoint = {
  date: string;

  productionKg:
    | string
    | null;

  completeReportCount: number;
  incompleteReportCount: number;
};

export type DashboardActivityType =
  | "DAILY_REPORT"
  | "ORDER"
  | "FEED_PURCHASE"
  | "DAILY_EXPENSE"
  | "EGG_STOCK_ADJUSTMENT"
  | "FEED_STOCK_ADJUSTMENT";

export type DashboardActivity = {
  id: string;

  type:
    DashboardActivityType;

  occurredAt: string;

  title: string;

  description?:
    | string
    | null;

  href?: string;
};

export type DashboardOnboarding = {
  isCompleted: boolean;
  hasKandang: boolean;
  hasOperator: boolean;
  hasFormula: boolean;
  hasEggPrice: boolean;
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

  alerts:
    DashboardAlert[];

  kandangs:
    DashboardKandangToday[];

  productionTrend:
    DashboardProductionTrendPoint[];

  recentActivities:
    DashboardActivity[];

  onboarding:
    DashboardOnboarding;
};