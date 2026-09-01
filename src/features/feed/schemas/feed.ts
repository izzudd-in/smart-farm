import type {
  FeedFormulaInput,
  FeedIngredientInput,
} from "@/features/feed/types/feed";

export class FeedValidationError extends Error {}

function requiredText(
  value: string,
  label: string,
  maxLength = 100,
): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new FeedValidationError(
      `${label} wajib diisi.`,
    );
  }

  if (normalized.length > maxLength) {
    throw new FeedValidationError(
      `${label} maksimal ${maxLength} karakter.`,
    );
  }

  return normalized;
}

function normalizeDecimal(
  value: string,
): string {
  return value
    .trim()
    .replace(",", ".");
}

export function percentageToBasisPoints(
  value: string,
): number {
  const normalized =
    normalizeDecimal(value);

  if (
    !/^\d{1,3}(\.\d{1,2})?$/.test(
      normalized,
    )
  ) {
    throw new FeedValidationError(
      "Persentase komposisi tidak valid.",
    );
  }

  const [whole, fraction = ""] =
    normalized.split(".");

  const basisPoints =
    Number(whole) * 100 +
    Number(
      fraction
        .padEnd(2, "0")
        .slice(0, 2),
    );

  if (
    basisPoints <= 0 ||
    basisPoints > 10000
  ) {
    throw new FeedValidationError(
      "Persentase harus lebih dari 0% dan maksimal 100%.",
    );
  }

  return basisPoints;
}

function basisPointsToString(
  basisPoints: number,
): string {
  return (
    basisPoints / 100
  ).toFixed(2);
}

export function parseFeedIngredientInput(
  input: FeedIngredientInput,
) {
  const price =
    normalizeDecimal(
      input.currentPricePerKg,
    );

  if (
    !/^\d+(\.\d{1,2})?$/.test(
      price,
    ) ||
    Number(price) < 0
  ) {
    throw new FeedValidationError(
      "Harga/kg harus berupa angka 0 atau lebih dengan maksimal 2 desimal.",
    );
  }

  return {
    name: requiredText(
      input.name,
      "Nama bahan pakan",
    ),
    currentPricePerKg:
      Number(price).toFixed(2),
  };
}

export function parseFeedFormulaInput(
  input: FeedFormulaInput,
) {
  const name = requiredText(
    input.name,
    "Nama formula",
  );

  if (input.items.length === 0) {
    throw new FeedValidationError(
      "Formula belum memiliki komposisi.",
    );
  }

  const seenIngredients =
    new Set<string>();

  const items = input.items.map(
    (item) => {
      const ingredientId =
        item.ingredientId.trim();

      if (!ingredientId) {
        throw new FeedValidationError(
          "Bahan pakan pada komposisi wajib dipilih.",
        );
      }

      if (
        seenIngredients.has(
          ingredientId,
        )
      ) {
        throw new FeedValidationError(
          "Satu bahan pakan hanya boleh digunakan sekali dalam satu formula.",
        );
      }

      seenIngredients.add(
        ingredientId,
      );

      const basisPoints =
        percentageToBasisPoints(
          item.percentage,
        );

      return {
        ingredientId,
        percentage:
          basisPointsToString(
            basisPoints,
          ),
        basisPoints,
      };
    },
  );

  return {
    name,
    items,
    totalBasisPoints:
      items.reduce(
        (total, item) =>
          total +
          item.basisPoints,
        0,
      ),
  };
}

export function assertFormulaComplete(
  totalBasisPoints: number,
): void {
  if (totalBasisPoints !== 10000) {
    throw new FeedValidationError(
      "Total komposisi formula harus tepat 100% sebelum dapat diaktifkan.",
    );
  }
}