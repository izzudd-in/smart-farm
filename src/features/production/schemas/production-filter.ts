import type {
  ProductionFilters,
  ProductionPeriodMode,
} from "@/features/production/types/production";
import {
  getJakartaTodayString,
  parseDateOnly,
} from "@/features/daily-operations/utils/date";
import {
  getStartOfMonth,
  getStartOfWeek,
} from "@/features/production/utils/dates";

function isValidDate(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = parseDateOnly(value);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

export function parseProductionFilters(input: {
  from?: string;
  to?: string;
  kandangId?: string;
  mode?: string;
}): ProductionFilters {
  const today = getJakartaTodayString();

  // Validate or fallback "to" date
  const to =
    isValidDate(input.to) && input.to <= today
      ? input.to
      : today;

  // Determine mode:
  // If mode is explicitly provided, use it.
  // If no params (first visit), default to "weekly" as required by FT-090.
  // If from & to provided without mode, infer mode.
  let mode: ProductionPeriodMode = "weekly";

  if (input.mode === "today" || input.mode === "weekly" || input.mode === "monthly" || input.mode === "custom") {
    mode = input.mode;
  } else if (!input.from && !input.to) {
    // FT-090: Default periode Minggu Ini (Weekly)
    mode = "weekly";
  } else if (input.from && input.to) {
    if (input.from === input.to) {
      mode = "today";
    } else if (input.from === getStartOfWeek(to)) {
      mode = "weekly";
    } else if (input.from === getStartOfMonth(to)) {
      mode = "monthly";
    } else {
      mode = "custom";
    }
  }

  let from: string;

  switch (mode) {
    case "today":
      from = to;
      break;
    case "weekly":
      from = getStartOfWeek(to);
      break;
    case "monthly":
      from = getStartOfMonth(to);
      break;
    case "custom":
    default:
      from =
        isValidDate(input.from) && input.from <= today
          ? input.from
          : getStartOfWeek(to);
      break;
  }

  if (from > to) {
    from = to;
  }

  return {
    from,
    to,
    kandangId: input.kandangId?.trim() ?? "",
    mode,
  };
}