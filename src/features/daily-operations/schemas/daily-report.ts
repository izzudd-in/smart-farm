import type {
  DailyFeedCompositionInput,
  DailyReportFormInput,
} from "@/features/daily-operations/types/daily-report";

import {
  DAILY_EXPENSE_CATEGORY_VALUES,
  type DailyExpenseCategoryValue,
} from "@/features/expenses/types/daily-expense";

import {
  centsToMoney,
  moneyToCents,
} from "@/features/expenses/utils/routine-cost-allocation";

import {
  assertFormulaComplete,
  percentageToBasisPoints,
} from "@/features/feed/schemas/feed";

export class DailyReportValidationError extends Error {}

function parseOptionalNumber(
  value: string,
  label: string,
): number | null {
  const normalized =
    value
      .trim()
      .replace(
        ",",
        ".",
      );

  if (!normalized) {
    return null;
  }

  const numberValue =
    Number(
      normalized,
    );

  if (
    !Number.isFinite(
      numberValue,
    ) ||
    numberValue < 0
  ) {
    throw new DailyReportValidationError(
      `${label} harus berupa angka 0 atau lebih.`,
    );
  }

  return numberValue;
}

function parseOptionalInteger(
  value: string,
  label: string,
): number | null {
  const normalized =
    value.trim();

  if (!normalized) {
    return null;
  }

  const numberValue =
    Number(
      normalized,
    );

  if (
    !Number.isInteger(
      numberValue,
    ) ||
    numberValue < 0
  ) {
    throw new DailyReportValidationError(
      `${label} harus berupa angka bulat 0 atau lebih.`,
    );
  }

  return numberValue;
}

function parseIncidentalExpense(
  amountInput: string,
  categoryInput: string,
) {
  const normalized =
    amountInput
      .trim()
      .replace(
        ",",
        ".",
      );

  if (!normalized) {
    return {
      incidentalExpense:
        null,

      incidentalExpenseCategory:
        null,
    };
  }

  if (
    !/^\d{1,16}(\.\d{1,2})?$/.test(
      normalized,
    )
  ) {
    throw new DailyReportValidationError(
      "Nominal pengeluaran harus berupa angka dengan maksimal 2 angka desimal.",
    );
  }

  const cents =
    moneyToCents(
      normalized,
    );

  if (
    cents <= BigInt(0)
  ) {
    throw new DailyReportValidationError(
      "Nominal pengeluaran harus lebih dari 0.",
    );
  }

  if (
    !DAILY_EXPENSE_CATEGORY_VALUES.includes(
      categoryInput as DailyExpenseCategoryValue,
    )
  ) {
    throw new DailyReportValidationError(
      "Kategori pengeluaran wajib dipilih.",
    );
  }

  return {
    incidentalExpense:
      centsToMoney(
        cents,
      ),

    incidentalExpenseCategory:
      categoryInput as DailyExpenseCategoryValue,
  };
}

function parseFeedComposition(
  items: DailyFeedCompositionInput[],
) {
  if (
    items.length === 0
  ) {
    throw new DailyReportValidationError(
      "Komposisi pakan aktual belum tersedia.",
    );
  }

  const seen =
    new Set<string>();

  const parsed =
    items.map(
      (
        item,
      ) => {
        const ingredientId =
          item.ingredientId.trim();

        if (
          !ingredientId
        ) {
          throw new DailyReportValidationError(
            "Ingredient komposisi pakan tidak valid.",
          );
        }

        if (
          seen.has(
            ingredientId,
          )
        ) {
          throw new DailyReportValidationError(
            "Ingredient tidak boleh muncul dua kali dalam komposisi pakan.",
          );
        }

        seen.add(
          ingredientId,
        );

        const basisPoints =
          percentageToBasisPoints(
            item.percentage,
          );

        return {
          ingredientId,

          percentage:
            (
              basisPoints /
              100
            ).toFixed(
              2,
            ),

          basisPoints,
        };
      },
    );

  assertFormulaComplete(
    parsed.reduce(
      (
        total,
        item,
      ) =>
        total +
        item.basisPoints,
      0,
    ),
  );

  return parsed;
}

export function parseDailyReportInput(
  input: DailyReportFormInput,
  requireComplete: boolean,
) {
  const kandangId =
    input.kandangId.trim();

  if (
    !kandangId
  ) {
    throw new DailyReportValidationError(
      "Kandang wajib dipilih.",
    );
  }

  const saleableEgg =
    parseOptionalNumber(
      input.saleableEgg,
      "Telur Jual",
    );

  const damagedEgg =
    parseOptionalNumber(
      input.damagedEgg,
      "Telur Rusak",
    );

  const feedUsed =
    parseOptionalNumber(
      input.feedUsed,
      "Pakan Digunakan",
    );

  const mortality =
    parseOptionalInteger(
      input.mortality,
      "Ayam Mati",
    );

  if (
    requireComplete &&
    (
      saleableEgg === null ||
      damagedEgg === null ||
      feedUsed === null ||
      mortality === null
    )
  ) {
    throw new DailyReportValidationError(
      "Lengkapi Telur Jual, Telur Rusak, Pakan Digunakan, dan Ayam Mati untuk menyelesaikan laporan.",
    );
  }

  const incidentNote =
    input.incidentNote.trim();

  if (
    incidentNote.length >
    1000
  ) {
    throw new DailyReportValidationError(
      "Catatan maksimal 1000 karakter.",
    );
  }

  const incidental =
    parseIncidentalExpense(
      input.incidentalExpense,
      input.incidentalExpenseCategory,
    );

  const hasAnyValue =
    saleableEgg !==
      null ||
    damagedEgg !==
      null ||
    feedUsed !==
      null ||
    mortality !==
      null ||
    incidental.incidentalExpense !==
      null ||
    Boolean(
      incidentNote,
    );

  if (
    !requireComplete &&
    !hasAnyValue
  ) {
    throw new DailyReportValidationError(
      "Isi minimal satu data sebelum menyimpan draft.",
    );
  }

  return {
    kandangId,
    saleableEgg,
    damagedEgg,
    feedUsed,
    mortality,

    ...incidental,

    incidentNote:
      incidentNote ||
      null,

    feedCompositionOverride:
      Boolean(
        input.feedCompositionOverride,
      ),

    feedComposition:
      input.feedCompositionOverride
        ? parseFeedComposition(
            input.feedComposition,
          )
        : [],
  };
}