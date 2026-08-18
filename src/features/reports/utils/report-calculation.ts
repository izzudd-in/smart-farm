import {
  percentageToBasisPoints,
} from "@/features/feed/schemas/feed";

import {
  applyBasisPointsToMilliKg,
  milliKgToQuantity,
  quantityToMilliKg,
} from "@/features/inventory/utils/quantity";

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

function formatHundredths(
  value: bigint,
): string {
  const whole =
    value /
    BigInt(100);

  const fraction =
    value %
    BigInt(100);

  return `${whole}.${fraction
    .toString()
    .padStart(
      2,
      "0",
    )}`;
}

export function calculateDamageRatePercent(
  saleableEggKg:
    | string
    | number,
  damagedEggKg:
    | string
    | number,
): string | null {
  const saleable =
    quantityToMilliKg(
      saleableEggKg,
    );

  const damaged =
    quantityToMilliKg(
      damagedEggKg,
    );

  const total =
    saleable +
    damaged;

  if (
    total <= BigInt(0)
  ) {
    return null;
  }

  /*
   * hundredths-of-percent:
   *
   * damaged / total × 100%
   *
   * 2.50% = 250
   */
  const hundredthsPercent =
    divideRoundHalfUp(
      damaged *
        BigInt(10000),
      total,
    );

  return formatHundredths(
    hundredthsPercent,
  );
}

export function calculateSnapshotFeedUsageMilliKg(
  feedUsedKg:
    | string
    | number,
  percentage: string,
): bigint {
  const feedUsedMilliKg =
    quantityToMilliKg(
      feedUsedKg,
    );

  const basisPoints =
    percentageToBasisPoints(
      percentage,
    );

  return applyBasisPointsToMilliKg(
    feedUsedMilliKg,
    basisPoints,
  );
}

export function reportMilliKgToQuantity(
  value: bigint,
): string {
  return milliKgToQuantity(
    value,
  );
}