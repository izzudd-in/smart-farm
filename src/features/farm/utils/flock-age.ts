const MILLISECONDS_PER_DAY =
  24 * 60 * 60 * 1000;

function getJakartaDateParts(
  date: Date,
): {
  year: number;
  month: number;
  day: number;
} {
  const parts = new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) =>
        ["year", "month", "day"].includes(
          part.type,
        ),
      )
      .map((part) => [
        part.type,
        Number(part.value),
      ]),
  );

  return {
    year: values.year,
    month: values.month,
    day: values.day,
  };
}

export function getJakartaDateString(
  date = new Date(),
): string {
  const { year, month, day } =
    getJakartaDateParts(date);

  return [
    year.toString().padStart(4, "0"),
    month.toString().padStart(2, "0"),
    day.toString().padStart(2, "0"),
  ].join("-");
}

export function calculateFlockAge(
  startDate: Date,
  referenceDate = new Date(),
): {
  totalDays: number;
  label: string;
} {
  const reference =
    getJakartaDateParts(referenceDate);

  const referenceTimestamp = Date.UTC(
    reference.year,
    reference.month - 1,
    reference.day,
  );

  const startTimestamp = Date.UTC(
    startDate.getUTCFullYear(),
    startDate.getUTCMonth(),
    startDate.getUTCDate(),
  );

  const totalDays = Math.max(
    0,
    Math.floor(
      (referenceTimestamp - startTimestamp) /
        MILLISECONDS_PER_DAY,
    ),
  );

  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;

  if (weeks === 0) {
    return {
      totalDays,
      label: `${totalDays} hari`,
    };
  }

  if (days === 0) {
    return {
      totalDays,
      label: `${weeks} minggu`,
    };
  }

  return {
    totalDays,
    label: `${weeks} minggu ${days} hari`,
  };
}