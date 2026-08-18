import type {
  OwnerDailyFilters,
  OwnerDailyStatusFilter,
} from "@/features/daily-operations/types/daily-report";
import { getJakartaTodayString } from "@/features/daily-operations/utils/date";

const VALID_STATUSES =
  new Set<OwnerDailyStatusFilter>([
    "ALL",
    "NOT_STARTED",
    "INCOMPLETE",
    "COMPLETE",
  ]);

function validDate(
  value: string | undefined,
): value is string {
  if (
    !value ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date = new Date(
    `${value}T00:00:00.000Z`,
  );

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) ===
      value
  );
}

export function parseOwnerDailyFilters(
  input: {
    date?: string;
    kandangId?: string;
    status?: string;
  },
): OwnerDailyFilters {
  const today =
    getJakartaTodayString();

  const date =
    validDate(input.date) &&
    input.date <= today
      ? input.date
      : today;

  const requestedStatus =
    input.status as
      | OwnerDailyStatusFilter
      | undefined;

  return {
    date,

    kandangId:
      input.kandangId?.trim() ?? "",

    status:
      requestedStatus &&
      VALID_STATUSES.has(
        requestedStatus,
      )
        ? requestedStatus
        : "ALL",
  };
}