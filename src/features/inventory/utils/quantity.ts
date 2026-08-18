const QUANTITY_SCALE = 3;

function normalizeQuantity(
  value: string | number,
): string {
  if (
    typeof value === "number"
  ) {
    if (
      !Number.isFinite(value)
    ) {
      throw new Error(
        "Invalid quantity.",
      );
    }

    return value.toFixed(
      QUANTITY_SCALE,
    );
  }

  return value.trim();
}

export function quantityToMilliKg(
  value: string | number,
): bigint {
  const normalized =
    normalizeQuantity(value);

  const negative =
    normalized.startsWith("-");

  const unsigned =
    negative
      ? normalized.slice(1)
      : normalized;

  if (
    !/^\d+(\.\d+)?$/.test(
      unsigned,
    )
  ) {
    throw new Error(
      "Invalid quantity.",
    );
  }

  const [whole, fraction = ""] =
    unsigned.split(".");

  const scaledFraction =
    fraction
      .padEnd(
        QUANTITY_SCALE,
        "0",
      )
      .slice(
        0,
        QUANTITY_SCALE,
      );

  const result =
    BigInt(whole) * BigInt(1000) +
    BigInt(
      scaledFraction || "0",
    );

  return negative
    ? -result
    : result;
}

export function milliKgToQuantity(
  value: bigint,
): string {
  const negative =
    value < BigInt(0);

  const absolute =
    negative
      ? -value
      : value;

  const whole =
    absolute / BigInt(1000);

  const fraction =
    absolute % BigInt(1000);

  const result =
    `${whole}.${fraction
      .toString()
      .padStart(3, "0")}`;

  return negative
    ? `-${result}`
    : result;
}

export function applyBasisPointsToMilliKg(
  quantityMilliKg: bigint,
  basisPoints: number,
): bigint {
  if (
    !Number.isInteger(
      basisPoints,
    ) ||
    basisPoints < 0 ||
    basisPoints > 10000
  ) {
    throw new Error(
      "Invalid basis points.",
    );
  }

  const denominator =
    BigInt(10000);

  const numerator =
    quantityMilliKg *
    BigInt(basisPoints);

  const quotient =
    numerator / denominator;

  const remainder =
    numerator % denominator;

  return (
    remainder * BigInt(2) >=
    denominator
  )
    ? quotient + BigInt(1)
    : quotient;
}