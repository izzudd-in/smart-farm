import {
  milliKgToQuantity,
  quantityToMilliKg,
} from "@/features/inventory/utils/quantity";

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
      "Invalid money value.",
    );
  }

  const [
    whole,
    fraction = "",
  ] = normalized.split(".");

  return (
    BigInt(whole) * BigInt(100) +
    BigInt(
      fraction
        .padEnd(2, "0")
        .slice(0, 2),
    )
  );
}

function centsToMoney(
  cents: bigint,
): string {
  const whole =
    cents / BigInt(100);

  const fraction =
    cents % BigInt(100);

  return `${whole}.${fraction
    .toString()
    .padStart(2, "0")}`;
}

export function calculateFeedPurchaseTotal(
  quantityKg: string,
  unitPricePerKg: string,
): string {
  const quantityMilliKg =
    quantityToMilliKg(
      quantityKg,
    );

  const unitPriceCents =
    moneyToCents(
      unitPricePerKg,
    );

  const numerator =
    quantityMilliKg *
    unitPriceCents;

  const denominator =
    BigInt(1000);

  let totalCents =
    numerator /
    denominator;

  const remainder =
    numerator %
    denominator;

  if (
    remainder * BigInt(2) >=
    denominator
  ) {
    totalCents += BigInt(1);
  }

  return centsToMoney(
    totalCents,
  );
}

export function addMilliKg(
  current: string,
  quantity: bigint,
): string {
  return milliKgToQuantity(
    quantityToMilliKg(
      current,
    ) + quantity,
  );
}