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
  if (!input || typeof input !== "object") {
    throw new FarmValidationError("Data input kandang tidak valid.");
  }

  const rawCode = typeof input.code === "string" ? input.code : "";
  const trimmedCode = rawCode.trim();

  if (!trimmedCode) {
    throw new FarmValidationError("Kode kandang wajib diisi.");
  }

  if (trimmedCode.length > 20) {
    throw new FarmValidationError("Kode kandang maksimal 20 karakter.");
  }

  if (/\s/.test(trimmedCode)) {
    throw new FarmValidationError(
      "Kode kandang tidak boleh mengandung spasi.",
    );
  }

  const code = trimmedCode.toUpperCase();

  if (!/^[A-Z0-9_-]+$/.test(code)) {
    throw new FarmValidationError(
      "Kode kandang hanya boleh berisi huruf, angka, tanda - atau _.",
    );
  }

  const name = requiredText(
    input.name,
    "Nama kandang",
    100,
  );

  const rawOperators = Array.isArray(input.operatorIds)
    ? input.operatorIds
    : [];

  const operatorIds = Array.from(
    new Set(
      rawOperators.filter(
        (id): id is string => typeof id === "string" && Boolean(id.trim()),
      ),
    ),
  );

  return {
    code,
    name,
    operatorIds,
  };
}

export function parseFlockInput(
  input: FlockInput,
) {
  if (!input || typeof input !== "object") {
    throw new FarmValidationError("Data input flock tidak valid.");
  }

  const rawName = typeof input.name === "string" ? input.name : "";
  const name = requiredText(
    rawName,
    "Nama flock",
    100,
  );

  const rawStartDate = typeof input.startDate === "string" ? input.startDate : "";
  const startDate = parseStartDate(rawStartDate);

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
    name,
    startDate,
    initialPopulation,
  };
}