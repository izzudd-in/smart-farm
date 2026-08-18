import type {
  FeedAdjustmentInput,
  FeedOpeningInput,
  FeedPurchaseInput,
} from "@/features/inventory/types/inventory";

import {
  InventoryValidationError,
  parseInventoryDate,
  parseInventoryQuantity,
  parseOptionalInventoryNote,
  parseRequiredInventoryNote,
} from "@/features/inventory/schemas/egg-stock";

function requiredIngredientId(
  value: string,
): string {
  const ingredientId =
    value.trim();

  if (!ingredientId) {
    throw new InventoryValidationError(
      "Bahan pakan wajib dipilih.",
    );
  }

  return ingredientId;
}

function optionalText(
  value: string,
  label: string,
  maxLength: number,
): string | null {
  const normalized =
    value.trim();

  if (!normalized) {
    return null;
  }

  if (
    normalized.length >
    maxLength
  ) {
    throw new InventoryValidationError(
      `${label} maksimal ${maxLength} karakter.`,
    );
  }

  return normalized;
}

function parsePositiveMoney(
  value: string,
): string {
  const normalized =
    value
      .trim()
      .replace(",", ".");

  if (
    !/^\d+(\.\d{1,2})?$/.test(
      normalized,
    ) ||
    Number(normalized) <= 0
  ) {
    throw new InventoryValidationError(
      "Harga/kg harus lebih dari 0 dengan maksimal 2 angka desimal.",
    );
  }

  return Number(
    normalized,
  ).toFixed(2);
}

export function parseFeedPurchaseInput(
  input: FeedPurchaseInput,
) {
  return {
    ingredientId:
      requiredIngredientId(
        input.ingredientId,
      ),

    purchasedAt:
      parseInventoryDate(
        input.purchasedAt,
      ),

    quantityKg:
      parseInventoryQuantity(
        input.quantityKg,
      ),

    unitPricePerKg:
      parsePositiveMoney(
        input.unitPricePerKg,
      ),

    supplier:
      optionalText(
        input.supplier,
        "Supplier",
        100,
      ),

    note:
      parseOptionalInventoryNote(
        input.note,
      ),
  };
}

export function parseFeedOpeningInput(
  input: FeedOpeningInput,
) {
  return {
    ingredientId:
      requiredIngredientId(
        input.ingredientId,
      ),

    occurredAt:
      parseInventoryDate(
        input.occurredAt,
      ),

    quantityKg:
      parseInventoryQuantity(
        input.quantityKg,
      ),

    note:
      parseOptionalInventoryNote(
        input.note,
      ),
  };
}

export function parseFeedAdjustmentInput(
  input: FeedAdjustmentInput,
) {
  if (
    input.type !== "INCREASE" &&
    input.type !== "DECREASE"
  ) {
    throw new InventoryValidationError(
      "Tipe koreksi tidak valid.",
    );
  }

  return {
    ingredientId:
      requiredIngredientId(
        input.ingredientId,
      ),

    occurredAt:
      parseInventoryDate(
        input.occurredAt,
      ),

    type: input.type,

    quantityKg:
      parseInventoryQuantity(
        input.quantityKg,
      ),

    note:
      parseRequiredInventoryNote(
        input.note,
        "Alasan koreksi",
      ),
  };
}