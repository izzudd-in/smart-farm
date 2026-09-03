import {
  getJakartaTodayString,
  parseDateOnly,
} from "@/features/daily-operations/utils/date";

export type ReportPeriodPreset = "today" | "7d" | "30d" | "this-month" | "custom";

export type ReportFilters = {
  from: string;
  to: string;
  preset: ReportPeriodPreset;
};

export class ReportFilterValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReportFilterValidationError";
  }
}

function isValidDateString(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  try {
    const date = parseDateOnly(value);
    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  } catch {
    return false;
  }
}

function shiftDays(dateStr: string, days: number): string {
  const date = parseDateOnly(dateStr);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function getCurrentMonthRange(todayStr: string): { from: string; to: string } {
  const [year, month] = todayStr.split("-").map(Number);
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const to = todayStr;
  return { from, to };
}

export function parseReportFilters(input: {
  from?: string | null;
  to?: string | null;
  preset?: string | null;
}): ReportFilters {
  const today = getJakartaTodayString();
  const monthRange = getCurrentMonthRange(today);

  // If a predefined preset is specified
  if (input.preset === "today") {
    return { from: today, to: today, preset: "today" };
  }

  if (input.preset === "7d") {
    return { from: shiftDays(today, -6), to: today, preset: "7d" };
  }

  if (input.preset === "30d") {
    return { from: shiftDays(today, -29), to: today, preset: "30d" };
  }

  if (input.preset === "this-month") {
    return { from: monthRange.from, to: monthRange.to, preset: "this-month" };
  }

  let from = isValidDateString(input.from ?? undefined)
    ? (input.from as string)
    : monthRange.from;

  let to = isValidDateString(input.to ?? undefined)
    ? (input.to as string)
    : monthRange.to;

  // Swap if from > to
  if (from > to) {
    [from, to] = [to, from];
  }

  // Prevent absurdly large date ranges (> 366 days)
  const fromDate = parseDateOnly(from);
  const toDate = parseDateOnly(to);
  const diffDays = Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 366) {
    from = shiftDays(to, -365);
  }

  // Determine matching preset if dates align
  let preset: ReportPeriodPreset = "custom";
  if (from === today && to === today) {
    preset = "today";
  } else if (from === shiftDays(today, -6) && to === today) {
    preset = "7d";
  } else if (from === shiftDays(today, -29) && to === today) {
    preset = "30d";
  } else if (from === monthRange.from && to === monthRange.to) {
    preset = "this-month";
  }

  return {
    from,
    to,
    preset,
  };
}
