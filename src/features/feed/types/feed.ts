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