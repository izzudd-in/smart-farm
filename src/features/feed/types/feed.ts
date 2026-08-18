export type FeedActionResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      error: string;
    };

export type FeedIngredientInput = {
  name: string;
  currentPricePerKg: string;
};

export type FeedFormulaItemInput = {
  ingredientId: string;
  percentage: string;
};

export type FeedFormulaInput = {
  name: string;
  items: FeedFormulaItemInput[];
};

export type FeedIngredientView = {
  id: string;
  name: string;
  unit: string;
  currentPricePerKg: string;
  isActive: boolean;
};

export type FeedFormulaItemView = {
  ingredientId: string;
  ingredientName: string;
  ingredientIsActive: boolean;
  percentage: string;
  currentPricePerKg: string;
};

export type FeedFormulaView = {
  id: string;
  name: string;
  isActive: boolean;
  items: FeedFormulaItemView[];
  totalPercentage: number;
  estimatedCostPerKg: number | null;
};

export type FeedPageData = {
  ingredients: FeedIngredientView[];
  formulas: FeedFormulaView[];
};

export type FeedTab =
  | "usage"
  | "formula"
  | "ingredient";

export type FeedUsageFilters = {
  from: string;
  to: string;
  kandangId: string;
};

export type FeedUsageKandangOption = {
  id: string;
  code: string;
  name: string;
};

export type FeedUsageIngredient = {
  ingredientId: string;
  ingredientName: string;
  percentage: number;
  quantityKg: number;
};

export type FeedUsageRow = {
  reportId: string;
  date: string;

  kandangId: string;
  kandangCode: string;
  kandangName: string;

  flockName: string;

  feedUsed: number;
  formulaName: string | null;

  ingredients: FeedUsageIngredient[];
};

export type FeedUsageSummary = {
  totalFeedUsed: number;
  averageDailyUsage: number;
  reportCount: number;
  mostUsedFormula: string | null;
};

export type FeedUsageData = {
  filters: FeedUsageFilters;
  kandangOptions: FeedUsageKandangOption[];
  summary: FeedUsageSummary;
  rows: FeedUsageRow[];
};