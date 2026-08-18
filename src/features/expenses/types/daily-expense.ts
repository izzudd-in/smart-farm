export const DAILY_EXPENSE_CATEGORY_VALUES = [
  "MEDICINE_VITAMIN",
  "DISINFECTANT",
  "OVERTIME",
  "MAINTENANCE",
  "TRANSPORT",
  "EQUIPMENT",
  "OTHER",
] as const;

export type DailyExpenseCategoryValue =
  (typeof DAILY_EXPENSE_CATEGORY_VALUES)[number];

export const DAILY_EXPENSE_CATEGORY_LABELS: Record<
  DailyExpenseCategoryValue,
  string
> = {
  MEDICINE_VITAMIN: "Obat & Vitamin",
  DISINFECTANT: "Disinfektan",
  OVERTIME: "Lembur",
  MAINTENANCE: "Perawatan",
  TRANSPORT: "Transportasi",
  EQUIPMENT: "Peralatan",
  OTHER: "Lainnya",
};

export type DailyExpenseSource =
  | "OWNER"
  | "OPERATION";

export type DailyExpenseSourceFilter =
  | "ALL"
  | DailyExpenseSource;

export type DailyExpenseCategoryFilter =
  | "ALL"
  | DailyExpenseCategoryValue;

export type DailyExpenseInput = {
  occurredAt: string;
  category: DailyExpenseCategoryValue;
  amount: string;
  description: string;
};

export type DailyExpenseFilters = {
  from: string;
  to: string;
  category: DailyExpenseCategoryFilter;
  source: DailyExpenseSourceFilter;
};

export type DailyExpenseView = {
  id: string;
  ownerExpenseId: string | null;

  source: DailyExpenseSource;
  occurredAt: string;
  createdAt: string;

  category: DailyExpenseCategoryValue | null;
  categoryLabel: string;

  amount: string;
  description: string;
  context: string | null;

  editable: boolean;
};

export type DailyExpenseSummary = {
  total: string;
  owner: string;
  operation: string;
  count: number;
};

export type DailyExpensesData = {
  filters: DailyExpenseFilters;
  summary: DailyExpenseSummary;
  expenses: DailyExpenseView[];
};

export type DailyExpenseActionResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      error: string;
    };