import {
  centsToMoney,
  moneyToCents,
} from "@/features/expenses/utils/routine-cost-allocation";

import {
  milliKgToQuantity,
  quantityToMilliKg,
} from "@/features/inventory/utils/quantity";

export function addMoney(
  ...values: string[]
): string {
  const cents =
    values.reduce(
      (
        total,
        value,
      ) =>
        total +
        moneyToCents(
          value,
        ),
      BigInt(0),
    );

  return centsToMoney(
    cents,
  );
}

export function addQuantityKg(
  ...values: Array<
    string | number
  >
): string {
  const milliKg =
    values.reduce(
      (
        total,
        value,
      ) =>
        total +
        quantityToMilliKg(
          value,
        ),
      BigInt(0),
    );

  return milliKgToQuantity(
    milliKg,
  );
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

export function calculateHppPerKg(
  totalCost: string,
  productionKg: string,
): string | null {
  const productionMilliKg =
    quantityToMilliKg(
      productionKg,
    );

  if (
    productionMilliKg <= BigInt(0)
  ) {
    return null;
  }

  const totalCostCents =
    moneyToCents(
      totalCost,
    );

  /*
   * cost cents / kg:
   *
   * totalCostCents
   * ---------------------
   * productionMilliKg/1000
   *
   * = totalCostCents * 1000
   *   / productionMilliKg
   */
  const hppCentsPerKg =
    divideRoundHalfUp(
      totalCostCents *
        BigInt(1000),

      productionMilliKg,
    );

  return centsToMoney(
    hppCentsPerKg,
  );
}

export function enumerateDateStrings(
  from: Date,
  to: Date,
): string[] {
  if (
    from > to
  ) {
    throw new Error(
      "Invalid HPP period.",
    );
  }

  const current =
    new Date(
      Date.UTC(
        from.getUTCFullYear(),
        from.getUTCMonth(),
        from.getUTCDate(),
      ),
    );

  const end =
    new Date(
      Date.UTC(
        to.getUTCFullYear(),
        to.getUTCMonth(),
        to.getUTCDate(),
      ),
    );

  const result:
    string[] = [];

  while (
    current <= end
  ) {
    result.push(
      current
        .toISOString()
        .slice(
          0,
          10,
        ),
    );

    current.setUTCDate(
      current.getUTCDate() +
        1,
    );
  }

  return result;
}