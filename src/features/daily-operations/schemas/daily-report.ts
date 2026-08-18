import type {
  DailyReportFormInput,
} from "@/features/daily-operations/types/daily-report";

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
    !/^\d+(\.\d{1,2})?$/.test(
      normalized,
    )
  ) {
    throw new DailyReportValidationError(
      "Pengeluaran harus berupa angka valid dengan maksimal 2 angka desimal.",
    );
  }

  if (Number(normalized) < 0) {
    throw new DailyReportValidationError(
      "Pengeluaran tidak boleh negatif.",
    );
  }

  return normalized;
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
  };
}