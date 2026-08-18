const DAY_MS =
  24 * 60 * 60 * 1000;

export function moneyToCents(
  value: string,
): bigint {
  const normalized =
    value.trim();

  const negative =
    normalized.startsWith("-");

  const unsigned =
    negative
      ? normalized.slice(1)
      : normalized;

  if (
    !/^\d+(\.\d{1,2})?$/.test(
      unsigned,
    )
  ) {
    throw new Error(
      "Invalid money value.",
    );
  }

  const [
    whole,
    fraction = "",
  ] = unsigned.split(".");

  const cents =
    BigInt(whole) * BigInt(100) +
    BigInt(
      fraction
        .padEnd(2, "0")
        .slice(0, 2),
    );

  return negative
    ? -cents
    : cents;
}

export function centsToMoney(
  cents: bigint,
): string {
  const negative =
    cents < BigInt(0);

  const absolute =
    negative
      ? -cents
      : cents;

  const whole =
    absolute / BigInt(100);

  const fraction =
    absolute % BigInt(100);

  const result =
    `${whole}.${fraction
      .toString()
      .padStart(2, "0")}`;

  return negative
    ? `-${result}`
    : result;
}

function startOfDate(
  value: Date,
): Date {
  return new Date(
    Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate(),
    ),
  );
}

export function getInclusiveDayCount(
  from: Date,
  to: Date,
): number {
  const normalizedFrom =
    startOfDate(from);

  const normalizedTo =
    startOfDate(to);

  if (
    normalizedFrom >
    normalizedTo
  ) {
    throw new Error(
      "Invalid date range.",
    );
  }

  return (
    Math.floor(
      (
        normalizedTo.getTime() -
        normalizedFrom.getTime()
      ) / DAY_MS,
    ) + 1
  );
}

export function getOverlapDayCount(
  costStart: Date,
  costEnd: Date,
  queryFrom: Date,
  queryTo: Date,
): number {
  const start =
    new Date(
      Math.max(
        startOfDate(
          costStart,
        ).getTime(),
        startOfDate(
          queryFrom,
        ).getTime(),
      ),
    );

  const end =
    new Date(
      Math.min(
        startOfDate(
          costEnd,
        ).getTime(),
        startOfDate(
          queryTo,
        ).getTime(),
      ),
    );

  if (start > end) {
    return 0;
  }

  return getInclusiveDayCount(
    start,
    end,
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

export function calculateRoutineCostDailyAllocation(
  input: {
    amount: string;
    periodStart: Date;
    periodEnd: Date;
  },
): string {
  const amountCents =
    moneyToCents(
      input.amount,
    );

  const totalDays =
    getInclusiveDayCount(
      input.periodStart,
      input.periodEnd,
    );

  return centsToMoney(
    divideRoundHalfUp(
      amountCents,
      BigInt(
        totalDays,
      ),
    ),
  );
}

export function calculateRoutineCostAllocationForPeriod(
  input: {
    amount: string;
    periodStart: Date;
    periodEnd: Date;
    from: Date;
    to: Date;
  },
): string {
  const totalDays =
    getInclusiveDayCount(
      input.periodStart,
      input.periodEnd,
    );

  const overlapDays =
    getOverlapDayCount(
      input.periodStart,
      input.periodEnd,
      input.from,
      input.to,
    );

  if (
    overlapDays === 0
  ) {
    return "0.00";
  }

  const amountCents =
    moneyToCents(
      input.amount,
    );

  /*
   * Prorata dihitung dari nominal asli:
   *
   * amount × overlapDays / originalPeriodDays
   *
   * lalu dibulatkan half-up ke cent terdekat.
   * Dengan begitu full-period allocation selalu kembali
   * ke nominal RoutineCost asli.
   */
  const allocatedCents =
    divideRoundHalfUp(
      amountCents *
        BigInt(
          overlapDays,
        ),
      BigInt(
        totalDays,
      ),
    );

  return centsToMoney(
    allocatedCents,
  );
}

export function sumMoney(
  values: string[],
): string {
  const total =
    values.reduce(
      (
        current,
        value,
      ) =>
        current +
        moneyToCents(
          value,
        ),
      BigInt(0),
    );

  return centsToMoney(
    total,
  );
}