import type { ProductionFilters } from "@/features/production/types/production";
import {
  getJakartaTodayString,
  parseDateOnly,
} from "@/features/daily-operations/utils/date";

function isValidDate(
  value: string | undefined,
): value is string {
  if (
    !value ||
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    return false;
  }

  const date =
    parseDateOnly(value);

  return (
    !Number.isNaN(
      date.getTime(),
    ) &&
    date
      .toISOString()
      .slice(0, 10) === value
  );
}

function getDefaultFromDate(
  today: string,
): string {
  const date =
    parseDateOnly(today);

  date.setUTCDate(
    date.getUTCDate() - 6,
  );

  return date
    .toISOString()
    .slice(0, 10);
}

export function parseProductionFilters(
  input: {
    from?: string;
    to?: string;
    kandangId?: string;
  },
): ProductionFilters {
  const today =
    getJakartaTodayString();

  const to =
    isValidDate(input.to) &&
    input.to <= today
      ? input.to
      : today;

  let from =
    isValidDate(input.from) &&
    input.from <= today
      ? input.from
      : getDefaultFromDate(to);

  if (from > to) {
    from = to;
  }

  return {
    from,
    to,

    kandangId:
      input.kandangId?.trim() ??
      "",
  };
}