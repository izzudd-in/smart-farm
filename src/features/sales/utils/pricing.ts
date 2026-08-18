function decimalToScaledInteger(
  value: string,
  scale: number,
): bigint {
  const normalized =
    value.trim();

  const pattern =
    new RegExp(
      `^\\d+(\\.\\d{1,${scale}})?$`,
    );

  if (!pattern.test(normalized)) {
    throw new Error(
      "Invalid decimal value.",
    );
  }

  const [
    whole,
    fraction = "",
  ] = normalized.split(".");

  const scaledFraction =
    fraction
      .padEnd(scale, "0")
      .slice(0, scale);

  return (
    BigInt(whole) *
      BigInt(10) **
        BigInt(scale) +
    BigInt(
      scaledFraction || "0",
    )
  );
}

function scaledIntegerToDecimal(
  value: bigint,
  scale: number,
): string {
  const divisor =
    BigInt(10) **
    BigInt(scale);

  const whole =
    value / divisor;

  const fraction =
    value % divisor;

  return `${whole}.${fraction
    .toString()
    .padStart(scale, "0")}`;
}

function moneyToCents(
  value: string,
): bigint {
  return decimalToScaledInteger(
    value,
    2,
  );
}

function centsToMoney(
  value: bigint,
): string {
  return scaledIntegerToDecimal(
    value,
    2,
  );
}

export function calculateFinalPricePerKg(
  basePricePerKg: string,
  discountPerKg: string,
): string {
  const base =
    moneyToCents(
      basePricePerKg,
    );

  const discount =
    moneyToCents(
      discountPerKg,
    );

  return centsToMoney(
    base > discount
      ? base - discount
      : BigInt(0),
  );
}

export function calculateOrderTotal(
  quantityKg: string,
  finalPricePerKg: string,
): string {
  const quantityMilliKg =
    decimalToScaledInteger(
      quantityKg,
      3,
    );

  const priceCents =
    moneyToCents(
      finalPricePerKg,
    );

  const numerator =
    quantityMilliKg *
    priceCents;

  const divisor = BigInt(1000);

  let totalCents =
    numerator / divisor;

  const remainder =
    numerator % divisor;

  if (
    remainder * BigInt(2) >=
    divisor
  ) {
    totalCents += BigInt(1);
  }

  return centsToMoney(
    totalCents,
  );
}