import { parseDateOnly } from "@/features/daily-operations/utils/date";
import type {
  EggAdjustmentInput,
  EggOpeningInput,
} from "@/features/inventory/types/inventory";

export class InventoryValidationError extends Error {}

export function parseInventoryDate(
  value: string,
): Date {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    throw new InventoryValidationError(
      "Tanggal tidak valid.",
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
    throw new InventoryValidationError(
      "Tanggal tidak valid.",
    );
  }

  return date;
}

export function parseInventoryQuantity(
  value: string,
): string {
  const normalized =
    value
      .trim()
      .replace(",", ".");

  if (
    !/^\d+(\.\d{1,3})?$/.test(
      normalized,
    ) ||
    Number(normalized) <= 0
  ) {
    throw new InventoryValidationError(
      "Jumlah harus lebih dari 0 kg dengan maksimal 3 angka desimal.",
    );
  }

  const [whole, fraction = ""] =
    normalized.split(".");

  const cleanFraction =
    fraction.replace(/0+$/, "");

  return cleanFraction
    ? `${whole}.${cleanFraction}`
    : whole;
}

export function parseOptionalInventoryNote(
  value: string,
  label = "Catatan",
  maxLength = 1000,
): string | null {
  const note = value.trim();

  if (!note) {
    return null;
  }

  if (note.length > maxLength) {
    throw new InventoryValidationError(
      `${label} maksimal ${maxLength} karakter.`,
    );
  }

  return note;
}

export function parseRequiredInventoryNote(
  value: string,
  label = "Alasan",
  maxLength = 1000,
): string {
  const note = value.trim();

  if (!note) {
    throw new InventoryValidationError(
      `${label} wajib diisi.`,
    );
  }

  if (note.length > maxLength) {
    throw new InventoryValidationError(
      `${label} maksimal ${maxLength} karakter.`,
    );
  }

  return note;
}

export function parseEggOpeningInput(
  input: EggOpeningInput,
) {
  return {
    occurredAt:
      parseInventoryDate(
        input.occurredAt,
      ),

    quantityKg:
      parseInventoryQuantity(
        input.quantityKg,
      ),

    note:
      parseOptionalInventoryNote(
        input.note,
      ),
  };
}

export function parseEggAdjustmentInput(
  input: EggAdjustmentInput,
) {
  if (
    input.type !== "INCREASE" &&
    input.type !== "DECREASE"
  ) {
    throw new InventoryValidationError(
      "Tipe koreksi tidak valid.",
    );
  }

  return {
    occurredAt:
      parseInventoryDate(
        input.occurredAt,
      ),

    type: input.type,

    quantityKg:
      parseInventoryQuantity(
        input.quantityKg,
      ),

    note:
      parseRequiredInventoryNote(
        input.note,
        "Alasan koreksi",
      ),
  };
}