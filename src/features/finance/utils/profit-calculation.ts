import {
  centsToMoney,
  moneyToCents,
} from "@/features/expenses/utils/routine-cost-allocation";

import {
  milliKgToQuantity,
  quantityToMilliKg,
} from "@/features/inventory/utils/quantity";

function divideRoundHalfUpSigned(
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

  const negative =
    numerator < BigInt(0);

  const absoluteNumerator =
    negative
      ? -numerator
      : numerator;

  const quotient =
    absoluteNumerator /
    denominator;

  const remainder =
    absoluteNumerator %
    denominator;

  const rounded =
    remainder * BigInt(2) >=
    denominator
      ? quotient + BigInt(1)
      : quotient;

  return negative
    ? -rounded
    : rounded;
}

function formatSignedHundredths(
  value: bigint,
): string {
  const negative =
    value < BigInt(0);

  const absolute =
    negative
      ? -value
      : value;

  const whole =
    absolute /
    BigInt(100);

  const fraction =
    absolute %
    BigInt(100);

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

export function normalizeProfitQuantityKg(
  value:
    | string
    | number,
): string {
  return milliKgToQuantity(
    quantityToMilliKg(
      value,
    ),
  );
}

export function subtractMoney(
  left: string,
  right: string,
): string {
  return centsToMoney(
    moneyToCents(
      left,
    ) -
      moneyToCents(
        right,
      ),
  );
}

export function calculateAverageSellingPricePerKg(
  revenue: string,
  soldKg: string,
): string | null {
  const soldMilliKg =
    quantityToMilliKg(
      soldKg,
    );

  if (
    soldMilliKg <= BigInt(0)
  ) {
    return null;
  }

  const revenueCents =
    moneyToCents(
      revenue,
    );

  /*
   * cents / kg =
   * revenueCents × 1000
   * -------------------
   * soldMilliKg
   */
  const centsPerKg =
    divideRoundHalfUpSigned(
      revenueCents *
        BigInt(1000),

      soldMilliKg,
    );

  return centsToMoney(
    centsPerKg,
  );
}

export function calculateOperationalMarginPercent(
  profit: string,
  revenue: string,
): string | null {
  const revenueCents =
    moneyToCents(
      revenue,
    );

  if (
    revenueCents <= BigInt(0)
  ) {
    return null;
  }

  const profitCents =
    moneyToCents(
      profit,
    );

  /*
   * Output disimpan sebagai
   * hundredths-of-percent.
   *
   * profit / revenue × 100%
   *
   * 33.33% = 3333
   */
  const hundredthsPercent =
    divideRoundHalfUpSigned(
      profitCents *
        BigInt(10000),

      revenueCents,
    );

  return formatSignedHundredths(
    hundredthsPercent,
  );
}

export function hasMoneyValue(
  value: string,
): boolean {
  return (
    moneyToCents(
      value,
    ) !== BigInt(0)
  );
}

export function quantitiesDiffer(
  first: string,
  second: string,
): boolean {
  return (
    quantityToMilliKg(
      first,
    ) !==
    quantityToMilliKg(
      second,
    )
  );
}