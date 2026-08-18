import {
  getJakartaTodayString,
  parseDateOnly,
} from "@/features/daily-operations/utils/date";

import {
  ROUTINE_COST_CATEGORY_VALUES,
  type RoutineCostCategoryValue,
  type RoutineCostFilters,
  type RoutineCostInput,
} from "@/features/expenses/types/routine-cost";

import {
  centsToMoney,
  moneyToCents,
} from "@/features/expenses/utils/routine-cost-allocation";

export class RoutineCostValidationError extends Error {}

function requiredText(
  value: string,
  label: string,
  maxLength: number,
): string {
  const normalized =
    value.trim();

  if (!normalized) {
    throw new RoutineCostValidationError(
      `${label} wajib diisi.`,
    );
  }

  if (
    normalized.length >
    maxLength
  ) {
    throw new RoutineCostValidationError(
      `${label} maksimal ${maxLength} karakter.`,
    );
  }

  return normalized;
}

function optionalText(
  value: string,
  label: string,
  maxLength: number,
): string | null {
  const normalized =
    value.trim();

  if (!normalized) {
    return null;
  }

  if (
    normalized.length >
    maxLength
  ) {
    throw new RoutineCostValidationError(
      `${label} maksimal ${maxLength} karakter.`,
    );
  }

  return normalized;
}

function parseDate(
  value: string,
  label: string,
): Date {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    throw new RoutineCostValidationError(
      `${label} tidak valid.`,
    );
  }

  const date =
    parseDateOnly(value);

  if (
    Number.isNaN(
      date.getTime(),
    ) ||
    date
      .toISOString()
      .slice(0, 10) !== value
  ) {
    throw new RoutineCostValidationError(
      `${label} tidak valid.`,
    );
  }

  return date;
}

function parseAmount(
  value: string,
): string {
  const normalized =
    value
      .trim()
      .replace(",", ".");

  if (
    !/^\d{1,16}(\.\d{1,2})?$/.test(
      normalized,
    )
  ) {
    throw new RoutineCostValidationError(
      "Nominal harus berupa angka dengan maksimal 2 angka desimal.",
    );
  }

  const cents =
    moneyToCents(
      normalized,
    );

  if (cents <= BigInt(0)) {
    throw new RoutineCostValidationError(
      "Nominal harus lebih dari 0.",
    );
  }

  return centsToMoney(
    cents,
  );
}

function parseCategory(
  value: string,
): RoutineCostCategoryValue {
  if (
    !ROUTINE_COST_CATEGORY_VALUES.includes(
      value as RoutineCostCategoryValue,
    )
  ) {
    throw new RoutineCostValidationError(
      "Kategori biaya tidak valid.",
    );
  }

  return value as RoutineCostCategoryValue;
}

function isValidFilterDate(
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

function getCurrentMonthRange(): RoutineCostFilters {
  const today =
    getJakartaTodayString();

  const [
    year,
    month,
  ] = today
    .split("-")
    .map(Number);

  const lastDay =
    new Date(
      Date.UTC(
        year,
        month,
        0,
      ),
    ).getUTCDate();

  return {
    from:
      `${year}-${month
        .toString()
        .padStart(2, "0")}-01`,

    to:
      `${year}-${month
        .toString()
        .padStart(2, "0")}-${lastDay
        .toString()
        .padStart(2, "0")}`,
  };
}

export function parseRoutineCostInput(
  input: RoutineCostInput,
) {
  const periodStart =
    parseDate(
      input.periodStart,
      "Tanggal mulai",
    );

  const periodEnd =
    parseDate(
      input.periodEnd,
      "Tanggal selesai",
    );

  if (
    periodStart >
    periodEnd
  ) {
    throw new RoutineCostValidationError(
      "Tanggal mulai tidak boleh setelah tanggal selesai.",
    );
  }

  return {
    name:
      requiredText(
        input.name,
        "Nama",
        120,
      ),

    category:
      parseCategory(
        input.category,
      ),

    amount:
      parseAmount(
        input.amount,
      ),

    periodStart,
    periodEnd,

    note:
      optionalText(
        input.note,
        "Catatan",
        1000,
      ),
  };
}

export function parseRoutineCostFilters(
  input: {
    from?: string;
    to?: string;
  },
): RoutineCostFilters {
  const defaults =
    getCurrentMonthRange();

  let from =
    isValidFilterDate(
      input.from,
    )
      ? input.from
      : defaults.from;

  let to =
    isValidFilterDate(
      input.to,
    )
      ? input.to
      : defaults.to;

  if (from > to) {
    [
      from,
      to,
    ] = [
      to,
      from,
    ];
  }

  return {
    from,
    to,
  };
}