import type {
  FeedCostBasis,
} from "@/generated/prisma/enums";

import {
  percentageToBasisPoints,
} from "@/features/feed/schemas/feed";

import {
  applyBasisPointsToMilliKg,
  milliKgToQuantity,
  quantityToMilliKg,
} from "@/features/inventory/utils/quantity";

type IngredientFeedCostInput = {
  feedUsedKg: string | number;
  percentage: string;
  unitCostPerKg: string;
};

export type IngredientFeedCostResult = {
  ingredientUsageKg: string;
  ingredientCost: string;
};

export type DailyReportFeedCostItemInput = {
  ingredientId: string;
  percentage: string;

  unitCostPerKgSnapshot:
    | string
    | null;

  costBasisSnapshot:
    | FeedCostBasis
    | null;
};

export type DailyReportFeedCostItemResult = {
  ingredientId: string;
  ingredientUsageKg: string;
  ingredientCost: string;
};

export type DailyReportFeedCostResult = {
  isComplete: boolean;

  totalCost:
    | string
    | null;

  items: DailyReportFeedCostItemResult[];

  missingIngredientIds: string[];
};

function moneyToCents(
  value: string,
): bigint {
  const normalized =
    value.trim();

  if (
    !/^\d+(\.\d{1,2})?$/.test(
      normalized,
    )
  ) {
    throw new Error(
      "Feed unit cost tidak valid.",
    );
  }

  const [
    whole,
    fraction = "",
  ] =
    normalized.split(
      ".",
    );

  return (
    BigInt(whole) *
      BigInt(100) +
    BigInt(
      fraction
        .padEnd(
          2,
          "0",
        )
        .slice(
          0,
          2,
        ),
    )
  );
}

function centsToMoney(
  value: bigint,
): string {
  const negative =
    value < BigInt(0);

  const absolute =
    negative
      ? -value
      : value;

  const whole =
    absolute / BigInt(100);

  const fraction =
    absolute % BigInt(100);

  const result =
    `${whole}.${fraction
      .toString()
      .padStart(
        2,
        "0",
      )}`;

  return negative
    ? `-${result}`
    : result;
}

function divideRoundHalfUp(
  numerator: bigint,
  denominator: bigint,
): bigint {
  if (
    denominator <= BigInt(0)
  ) {
    throw new Error(
      "Invalid denominator.",
    );
  }

  const quotient =
    numerator /
    denominator;

  const remainder =
    numerator %
    denominator;

  return (
    remainder * BigInt(2) >=
    denominator
  )
    ? quotient + BigInt(1)
    : quotient;
}

function calculateIngredientFeedCostInternal(
  input: IngredientFeedCostInput,
) {
  /*
   * quantityToMilliKg(number) sudah menormalisasi
   * number menjadi 3 decimal secara deterministic.
   */
  const feedUsedMilliKg =
    quantityToMilliKg(
      input.feedUsedKg,
    );

  const percentageBasisPoints =
    percentageToBasisPoints(
      input.percentage,
    );

  const ingredientUsageMilliKg =
    applyBasisPointsToMilliKg(
      feedUsedMilliKg,
      percentageBasisPoints,
    );

  const unitCostCents =
    moneyToCents(
      input.unitCostPerKg,
    );

  /*
   * milli-kg × cents/kg / 1000.
   * Hasil dibulatkan half-up ke cent.
   */
  const ingredientCostCents =
    divideRoundHalfUp(
      ingredientUsageMilliKg *
        unitCostCents,
      BigInt(1000),
    );

  return {
    ingredientUsageMilliKg,
    ingredientCostCents,
  };
}

export function calculateIngredientFeedCost(
  input: IngredientFeedCostInput,
): IngredientFeedCostResult {
  const result =
    calculateIngredientFeedCostInternal(
      input,
    );

  return {
    ingredientUsageKg:
      milliKgToQuantity(
        result.ingredientUsageMilliKg,
      ),

    ingredientCost:
      centsToMoney(
        result.ingredientCostCents,
      ),
  };
}

export function calculateDailyReportFeedCost(
  input: {
    feedUsedKg:
      | string
      | number;

    items: DailyReportFeedCostItemInput[];
  },
): DailyReportFeedCostResult {
  const feedUsedMilliKg =
    quantityToMilliKg(
      input.feedUsedKg,
    );

  /*
   * Jika feedUsed benar-benar 0,
   * feed cost adalah 0 walaupun legacy report
   * belum mempunyai cost snapshot.
   *
   * Missing snapshot hanya memblok biaya ketika
   * feedUsed > 0.
   */
  if (
    feedUsedMilliKg === BigInt(0)
  ) {
    return {
      isComplete:
        true,

      totalCost:
        "0.00",

      items:
        [],

      missingIngredientIds:
        [],
    };
  }

  const missingIngredientIds =
    input.items
      .filter(
        (
          item,
        ) =>
          item.unitCostPerKgSnapshot ===
            null ||
          item.costBasisSnapshot ===
            null,
      )
      .map(
        (
          item,
        ) =>
          item.ingredientId,
      );

  if (
    input.items.length ===
      0 ||
    missingIngredientIds.length >
      0
  ) {
    return {
      isComplete:
        false,

      totalCost:
        null,

      items:
        [],

      missingIngredientIds,
    };
  }

  let totalCostCents =
    BigInt(0);

  const items =
    input.items.map(
      (
        item,
      ): DailyReportFeedCostItemResult => {
        const unitCost =
          item.unitCostPerKgSnapshot;

        if (!unitCost) {
          throw new Error(
            "Unexpected missing feed cost snapshot.",
          );
        }

        const result =
          calculateIngredientFeedCostInternal({
            feedUsedKg:
              input.feedUsedKg,

            percentage:
              item.percentage,

            unitCostPerKg:
              unitCost,
          });

        totalCostCents +=
          result.ingredientCostCents;

        return {
          ingredientId:
            item.ingredientId,

          ingredientUsageKg:
            milliKgToQuantity(
              result.ingredientUsageMilliKg,
            ),

          ingredientCost:
            centsToMoney(
              result.ingredientCostCents,
            ),
        };
      },
    );

  return {
    isComplete:
      true,

    totalCost:
      centsToMoney(
        totalCostCents,
      ),

    items,

    missingIngredientIds:
      [],
  };
}