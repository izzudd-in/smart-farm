export type EggStockMovementType =
  | "OPENING"
  | "PRODUCTION"
  | "SALE"
  | "ADJUSTMENT_IN"
  | "ADJUSTMENT_OUT";

export type EggStockDirection =
  | "IN"
  | "OUT";

export type EggStockMovement = {
  id: string;
  type: EggStockMovementType;
  direction: EggStockDirection;
  occurredAt: string;
  createdAt: string;

  title: string;
  subtitle: string | null;

  quantityKg: string;
};

export type EggStockSummary = {
  asOfDate: string;

  openingKg: string;
  productionKg: string;
  salesKg: string;
  adjustmentNetKg: string;
  currentStockKg: string;

  hasOpening: boolean;
  isNegative: boolean;
};

export type EggInventoryData = {
  summary: EggStockSummary;
  movements: EggStockMovement[];
};

export type EggOpeningInput = {
  occurredAt: string;
  quantityKg: string;
  note: string;
};

export type EggAdjustmentInput = {
  occurredAt: string;
  type: "INCREASE" | "DECREASE";
  quantityKg: string;
  note: string;
};

export type InventoryActionResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      error: string;
    };

export type FeedPurchaseInput = {
  ingredientId: string;
  purchasedAt: string;
  quantityKg: string;
  unitPricePerKg: string;
  supplier: string;
  note: string;
};

export type FeedOpeningInput = {
  ingredientId: string;
  occurredAt: string;
  quantityKg: string;
  note: string;
};

export type FeedAdjustmentInput = {
  ingredientId: string;
  occurredAt: string;
  type: "INCREASE" | "DECREASE";
  quantityKg: string;
  note: string;
};

export type FeedInventoryIngredientOption = {
  id: string;
  name: string;
  isActive: boolean;
};

export type FeedStockIngredientSummary = {
  ingredientId: string;
  ingredientName: string;
  isActive: boolean;

  openingKg: string;
  purchaseKg: string;
  usageKg: string;
  adjustmentNetKg: string;
  currentStockKg: string;

  hasOpening: boolean;
  isNegative: boolean;
};

export type FeedStockAsOfData = {
  asOfDate: string;
  ingredients: FeedStockIngredientSummary[];
};

export type FeedStockMovementType =
  | "OPENING"
  | "PURCHASE"
  | "USAGE"
  | "ADJUSTMENT_IN"
  | "ADJUSTMENT_OUT";

export type FeedStockMovement = {
  id: string;
  type: FeedStockMovementType;
  direction: "IN" | "OUT";

  ingredientId: string;
  ingredientName: string;

  occurredAt: string;
  createdAt: string;

  title: string;
  subtitle: string | null;

  quantityKg: string;

  unitPricePerKg: string | null;
  totalPrice: string | null;
};

export type FeedInventoryData = {
  asOfDate: string;

  ingredients: FeedStockIngredientSummary[];

  ingredientOptions:
    FeedInventoryIngredientOption[];

  movements: FeedStockMovement[];
};