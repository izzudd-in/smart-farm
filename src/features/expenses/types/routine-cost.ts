export const ROUTINE_COST_CATEGORY_VALUES = [
  "SALARY",
  "ELECTRICITY",
  "WATER",
  "INTERNET",
  "RENT",
  "SECURITY",
  "OTHER",
] as const;

export type RoutineCostCategoryValue =
  (typeof ROUTINE_COST_CATEGORY_VALUES)[number];

export const ROUTINE_COST_CATEGORY_LABELS: Record<
  RoutineCostCategoryValue,
  string
> = {
  SALARY: "Gaji",
  ELECTRICITY: "Listrik",
  WATER: "Air",
  INTERNET: "Internet",
  RENT: "Sewa",
  SECURITY: "Keamanan",
  OTHER: "Lainnya",
};

export type RoutineCostInput = {
  name: string;
  category: RoutineCostCategoryValue;
  amount: string;
  periodStart: string;
  periodEnd: string;
  note: string;
};

export type RoutineCostFilters = {
  from: string;
  to: string;
};

export type RoutineCostView = {
  id: string;
  name: string;
  category: RoutineCostCategoryValue;
  categoryLabel: string;

  amount: string;

  periodStart: string;
  periodEnd: string;

  dailyAllocation: string;
  allocationInFilter: string;

  note: string | null;
  createdByName: string;
};

export type RoutineCostSummary = {
  originalAmount: string;
  allocatedAmount: string;
  componentCount: number;
};

export type RoutineCostsData = {
  filters: RoutineCostFilters;
  summary: RoutineCostSummary;
  costs: RoutineCostView[];
};

export type RoutineCostActionResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      error: string;
    };