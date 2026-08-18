import type {
  DailyFeedCompositionInput,
  DailyReportFormInput,
} from "@/features/daily-operations/types/daily-report";
import {
  assertFormulaComplete,
  percentageToBasisPoints,
} from "@/features/feed/schemas/feed";

export class DailyReportValidationError extends Error {}

function parseOptionalNumber(
  value: string,
  label: string,
): number | null {
  const normalized = value
    .trim()
    .replace(",", ".");

  if (!normalized) {
    return null;
  }

  const numberValue = Number(normalized);

  if (
    !Number.isFinite(numberValue) ||
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
  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  const numberValue = Number(normalized);

  if (
    !Number.isInteger(numberValue) ||
    numberValue < 0
  ) {
    throw new DailyReportValidationError(
      `${label} harus berupa angka bulat 0 atau lebih.`,
    );
  }

  return numberValue;
}

function parseOptionalMoney(
  value: string,
): string | null {
  const normalized = value
    .trim()
    .replace(",", ".");

  if (!normalized) {
    return null;
  }

  if (
    !/^\d+(\.\d{1,2})?$/.test(normalized) ||
    Number(normalized) < 0
  ) {
    throw new DailyReportValidationError(
      "Pengeluaran harus berupa angka 0 atau lebih dengan maksimal 2 desimal.",
    );
  }

  return Number(normalized).toFixed(2);
}

function parseFeedComposition(
  items: DailyFeedCompositionInput[],
) {
  if (items.length === 0) {
    throw new DailyReportValidationError(
      "Komposisi pakan aktual belum tersedia.",
    );
  }

  const seen = new Set<string>();

  const parsed = items.map((item) => {
    const ingredientId =
      item.ingredientId.trim();

    if (!ingredientId) {
      throw new DailyReportValidationError(
        "Ingredient komposisi pakan tidak valid.",
      );
    }

    if (seen.has(ingredientId)) {
      throw new DailyReportValidationError(
        "Ingredient tidak boleh muncul dua kali dalam komposisi pakan.",
      );
    }

    seen.add(ingredientId);

    const basisPoints =
      percentageToBasisPoints(
        item.percentage,
      );

    return {
      ingredientId,

      percentage:
        (basisPoints / 100).toFixed(2),

      basisPoints,
    };
  });

  assertFormulaComplete(
    parsed.reduce(
      (total, item) =>
        total + item.basisPoints,
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

  if (!kandangId) {
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

  if (incidentNote.length > 1000) {
    throw new DailyReportValidationError(
      "Catatan maksimal 1000 karakter.",
    );
  }

  return {
    kandangId,
    saleableEgg,
    damagedEgg,
    feedUsed,
    mortality,

    incidentalExpense:
      parseOptionalMoney(
        input.incidentalExpense,
      ),

    incidentNote:
      incidentNote || null,

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