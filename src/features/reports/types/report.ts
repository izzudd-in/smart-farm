import type {
  HppStatus,
} from "@/features/finance/types/hpp";

import type {
  ProfitStatus,
} from "@/features/finance/types/profit";

export type ReportFeedUsageItem = {
  ingredientId: string;
  ingredientName: string;
  usageKg: string;
};

export type ReportFeedStockItem = {
  ingredientId: string;
  ingredientName: string;
  stockKg: string;
  isNegative: boolean;
};

export type ReportSummaryForPeriod = {
  period: {
    from: string;
    to: string;
  };

  production: {
    saleableEggKg: string;
    damagedEggKg: string;
    totalEggKg: string;

    damageRatePercent:
      | string
      | null;

    mortalityCount: number;

    feedUsedKg: string;

    feedIngredients:
      ReportFeedUsageItem[];
  };

  sales: {
    revenue: string;
    soldKg: string;
    orderCount: number;

    averageSellingPricePerKg:
      | string
      | null;
  };

  inventory: {
    asOfDate: string;

    eggStockKg: string;
    eggStockNegative: boolean;

    feedStocks:
      ReportFeedStockItem[];
  };

  cost: {
    feedCost:
      | string
      | null;

    routineCost: string;

    dailyExpenseCost: string;

    totalOperationalCost:
      | string
      | null;
  };

  hpp: {
    hppPerKg:
      | string
      | null;

    status: HppStatus;
  };

  profit: {
    estimatedOperationalProfit:
      | string
      | null;

    operationalMarginPercent:
      | string
      | null;

    status: ProfitStatus;
  };

  dataQuality: {
    completeReports: number;
    incompleteReports: number;

    missingFeedCostReports: number;

    hppStatus: HppStatus;
    profitStatus: ProfitStatus;

    warnings: string[];
  };
};