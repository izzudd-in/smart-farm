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

export function getJakartaTodayString(
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

export function parseDateOnly(
  value: string,
): Date {
  return new Date(
    `${value}T00:00:00.000Z`,
  );
}

export function getJakartaTodayDate(): Date {
  return parseDateOnly(
    getJakartaTodayString(),
  );
}

export function formatReportDate(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      timeZone: "Asia/Jakarta",
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(
    parseDateOnly(value),
  );
}