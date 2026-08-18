import type {
  FlockInput,
  KandangInput,
} from "@/features/farm/types/farm";
import { getJakartaDateString } from "@/features/farm/utils/flock-age";

export class FarmValidationError extends Error {}

function requiredText(
  value: string,
  label: string,
  maxLength = 100,
): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new FarmValidationError(
      `${label} wajib diisi.`,
    );
  }

  if (normalized.length > maxLength) {
    throw new FarmValidationError(
      `${label} maksimal ${maxLength} karakter.`,
    );
  }

  return normalized;
}

function parseStartDate(
  value: string,
): Date {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    throw new FarmValidationError(
      "Tanggal mulai tidak valid.",
    );
  }

  const date = new Date(
    `${value}T00:00:00.000Z`,
  );

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !==
      value
  ) {
    throw new FarmValidationError(
      "Tanggal mulai tidak valid.",
    );
  }

  if (value > getJakartaDateString()) {
    throw new FarmValidationError(
      "Tanggal mulai tidak boleh di masa depan.",
    );
  }

  return date;
}

export function parseKandangInput(
  input: KandangInput,
) {
  const code = requiredText(
    input.code,
    "Kode kandang",
    20,
  ).toUpperCase();

  if (!/^[A-Z0-9_-]+$/.test(code)) {
    throw new FarmValidationError(
      "Kode kandang hanya boleh berisi huruf, angka, tanda - atau _.",
    );
  }

  return {
    code,
    name: requiredText(
      input.name,
      "Nama kandang",
    ),
    operatorIds: Array.from(
      new Set(
        input.operatorIds.filter(Boolean),
      ),
    ),
  };
}

export function parseFlockInput(
  input: FlockInput,
) {
  const initialPopulation = Number(
    input.initialPopulation,
  );

  if (
    !Number.isInteger(initialPopulation) ||
    initialPopulation <= 0
  ) {
    throw new FarmValidationError(
      "Populasi awal harus berupa angka bulat lebih dari 0.",
    );
  }

  return {
    name: requiredText(
      input.name,
      "Nama flock",
    ),
    startDate: parseStartDate(
      input.startDate,
    ),
    initialPopulation,
  };
}