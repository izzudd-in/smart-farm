import {
  parseDateOnly,
} from "@/features/daily-operations/utils/date";

import {
  parseRoutineCostFilters,
} from "@/features/expenses/schemas/routine-cost";

import {
  DAILY_EXPENSE_CATEGORY_VALUES,
  type DailyExpenseCategoryFilter,
  type DailyExpenseCategoryValue,
  type DailyExpenseFilters,
  type DailyExpenseInput,
  type DailyExpenseSourceFilter,
} from "@/features/expenses/types/daily-expense";

import {
  centsToMoney,
  moneyToCents,
} from "@/features/expenses/utils/routine-cost-allocation";

export class DailyExpenseValidationError extends Error {}

function parseDate(
  value: string,
): Date {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) {
    throw new DailyExpenseValidationError(
      "Tanggal pengeluaran wajib diisi.",
    );
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      trimmed,
    )
  ) {
    throw new DailyExpenseValidationError(
      "Tanggal tidak valid.",
    );
  }

  const date =
    parseDateOnly(trimmed);

  if (
    Number.isNaN(
      date.getTime(),
    ) ||
    date
      .toISOString()
      .slice(0, 10) !== trimmed
  ) {
    throw new DailyExpenseValidationError(
      "Tanggal tidak valid.",
    );
  }

  return date;
}

function parseCategory(
  value: string,
): DailyExpenseCategoryValue {
  if (
    !DAILY_EXPENSE_CATEGORY_VALUES.includes(
      value as DailyExpenseCategoryValue,
    )
  ) {
    throw new DailyExpenseValidationError(
      "Kategori pengeluaran tidak valid.",
    );
  }

  return value as DailyExpenseCategoryValue;
}

function parseAmount(
  value: string,
): string {
  const normalized =
    (typeof value === "string" ? value : "")
      .trim()
      .replace(",", ".");

  if (!normalized) {
    throw new DailyExpenseValidationError(
      "Nominal pengeluaran wajib diisi.",
    );
  }

  if (
    !/^\d{1,16}(\.\d{1,2})?$/.test(
      normalized,
    )
  ) {
    throw new DailyExpenseValidationError(
      "Nominal harus berupa angka positif dengan maksimal 2 angka desimal.",
    );
  }

  const cents =
    moneyToCents(
      normalized,
    );

  if (
    cents <= BigInt(0)
  ) {
    throw new DailyExpenseValidationError(
      "Nominal pengeluaran harus lebih dari 0.",
    );
  }

  return centsToMoney(
    cents,
  );
}

function parseDescription(
  value: string,
): string {
  const description =
    value.trim();

  if (!description) {
    throw new DailyExpenseValidationError(
      "Keterangan wajib diisi.",
    );
  }

  if (
    description.length >
    1000
  ) {
    throw new DailyExpenseValidationError(
      "Keterangan maksimal 1000 karakter.",
    );
  }

  return description;
}

export function parseDailyExpenseInput(
  input: DailyExpenseInput,
) {
  return {
    occurredAt:
      parseDate(
        input.occurredAt,
      ),

    category:
      parseCategory(
        input.category,
      ),

    amount:
      parseAmount(
        input.amount,
      ),

    description:
      parseDescription(
        input.description,
      ),
  };
}

export function parseDailyExpenseFilters(
  input: {
    from?: string;
    to?: string;
    category?: string;
    source?: string;
  },
): DailyExpenseFilters {
  const dateFilters =
    parseRoutineCostFilters({
      from:
        input.from,

      to:
        input.to,
    });

  const requestedCategory =
    input.category as
      | DailyExpenseCategoryFilter
      | undefined;

  const category: DailyExpenseCategoryFilter =
    requestedCategory ===
      "ALL" ||
    (requestedCategory && DAILY_EXPENSE_CATEGORY_VALUES.includes(
      requestedCategory as DailyExpenseCategoryValue,
    ))
      ? requestedCategory
      : "ALL";

  const requestedSource =
    input.source as
      | DailyExpenseSourceFilter
      | undefined;

  const source: DailyExpenseSourceFilter =
    requestedSource ===
      "OWNER" ||
    requestedSource ===
      "OPERATION"
      ? requestedSource
      : "ALL";

  return {
    ...dateFilters,
    category,
    source,
  };
}