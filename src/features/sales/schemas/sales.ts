import type {
  CustomerInput,
  EggPriceInput,
} from "@/features/sales/types/sales";
import { parseDateOnly } from "@/features/daily-operations/utils/date";

export class SalesValidationError extends Error {}

function requiredText(
  value: string,
  label: string,
  maxLength: number,
): string {
  const normalized =
    value.trim();

  if (!normalized) {
    throw new SalesValidationError(
      `${label} wajib diisi.`,
    );
  }

  if (
    normalized.length >
    maxLength
  ) {
    throw new SalesValidationError(
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
    throw new SalesValidationError(
      `${label} maksimal ${maxLength} karakter.`,
    );
  }

  return normalized;
}

function normalizeMoney(
  value: string,
): string {
  return value
    .trim()
    .replace(",", ".");
}

function parseNonNegativeMoney(
  value: string,
  label: string,
): string {
  const normalized =
    normalizeMoney(value);

  if (
    !/^\d+(\.\d{1,2})?$/.test(
      normalized,
    ) ||
    Number(normalized) < 0
  ) {
    throw new SalesValidationError(
      `${label} harus berupa angka 0 atau lebih dengan maksimal 2 desimal.`,
    );
  }

  return Number(
    normalized,
  ).toFixed(2);
}

function parsePositiveMoney(
  value: string,
  label: string,
): string {
  const result =
    parseNonNegativeMoney(
      value,
      label,
    );

  if (Number(result) <= 0) {
    throw new SalesValidationError(
      `${label} harus lebih dari 0.`,
    );
  }

  return result;
}

function parseEffectiveDate(
  value: string,
): Date {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    throw new SalesValidationError(
      "Tanggal berlaku tidak valid.",
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
    throw new SalesValidationError(
      "Tanggal berlaku tidak valid.",
    );
  }

  return date;
}

export function parseCustomerInput(
  input: CustomerInput,
) {
  return {
    name: requiredText(
      input.name,
      "Nama customer",
      100,
    ),

    phone: optionalText(
      input.phone,
      "Nomor telepon",
      30,
    ),

    address: optionalText(
      input.address,
      "Alamat",
      500,
    ),

    discountPerKg:
      parseNonNegativeMoney(
        input.discountPerKg ||
          "0",
        "Diskon/kg",
      ),
  };
}

export function parseEggPriceInput(
  input: EggPriceInput,
) {
  return {
    pricePerKg:
      parsePositiveMoney(
        input.pricePerKg,
        "Harga/kg",
      ),

    effectiveAt:
      parseEffectiveDate(
        input.effectiveAt,
      ),
  };
}