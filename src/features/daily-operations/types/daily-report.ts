import type {
  DailyExpenseCategoryValue,
} from "@/features/expenses/types/daily-expense";

export type DailyReportStatus =
  | "NOT_STARTED"
  | "INCOMPLETE"
  | "COMPLETE";

export type DailyFeedCompositionInput = {
  ingredientId: string;
  percentage: string;
};

export type DailyReportFormInput = {
  kandangId: string;
  saleableEgg: string;
  damagedEgg: string;
  feedUsed: string;
  mortality: string;

  incidentalExpense: string;
  incidentalExpenseCategory:
    | DailyExpenseCategoryValue
    | "";
  incidentNote: string;

  feedCompositionOverride: boolean;
  feedComposition: DailyFeedCompositionInput[];
};

export type DailyReportActionResult =
  | {
      success: true;
      message: string;
      status: DailyReportStatus;
    }
  | {
      success: false;
      error: string;
    };

export type DailyReportFeedItemView = {
  ingredientId: string;
  ingredientName: string;
  percentage: string;
};

export type DailyReportView = {
  id: string;
  date: string;

  kandangId: string;
  kandangCode: string;
  kandangName: string;

  flockId: string;
  flockName: string;
  flockStartDate: string;

  operatorId: string;
  operatorName: string;

  saleableEgg: number | null;
  damagedEgg: number | null;
  feedUsed: number | null;
  mortality: number | null;

  incidentalExpense: string | null;
  incidentalExpenseCategory:
    DailyExpenseCategoryValue | null;
  incidentNote: string | null;

  feedFormulaId: string | null;
  feedFormulaName: string | null;
  feedItems: DailyReportFeedItemView[];

  status: DailyReportStatus;
};

export type OperatorFeedContext = {
  formulaId: string | null;
  formulaName: string | null;
  items: DailyReportFeedItemView[];

  source:
    | "REPORT_SNAPSHOT"
    | "ACTIVE_FORMULA"
    | "NONE";
};

export type OperatorTodayKandang = {
  id: string;
  code: string;
  name: string;

  flock: {
    id: string;
    name: string;
    startDate: string;
  };

  report: DailyReportView | null;
  status: DailyReportStatus;

  feed: OperatorFeedContext;

  isEditable: boolean;
  readOnlyReason: string | null;
};

export type OperatorTodayData = {
  date: string;
  operatorId: string;
  operatorName: string;
  kandangs: OperatorTodayKandang[];
};

export type OwnerDailyStatusFilter =
  | "ALL"
  | DailyReportStatus;

export type OwnerDailyFilters = {
  date: string;
  kandangId: string;
  status: OwnerDailyStatusFilter;
};

export type OwnerDailyKandangOption = {
  id: string;
  code: string;
  name: string;
};

export type OwnerDailyRow = {
  kandangId: string;
  kandangCode: string;
  kandangName: string;

  flockName: string | null;
  operatorNames: string[];

  report: DailyReportView | null;
  status: DailyReportStatus;
};

export type OwnerDailySummary = {
  total: number;
  complete: number;
  incomplete: number;
  notStarted: number;
};

export type OwnerDailyData = {
  date: string;
  filters: OwnerDailyFilters;
  kandangOptions: OwnerDailyKandangOption[];
  rows: OwnerDailyRow[];
  summary: OwnerDailySummary;
};