import type {
  CustomerInput,
  EggPriceInput,
  OrderFilters,
  OrderInput,
  OrderPricingPreviewInput,
} from "@/features/sales/types/sales";
import {
  getJakartaTodayString,
  parseDateOnly,
} from "@/features/daily-operations/utils/date";

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
  const normalized =
    normalizeMoney(value);

  const num =
    Number(normalized);

  if (
    Number.isNaN(num) ||
    num <= 0 ||
    !/^\d+(\.\d{1,2})?$/.test(
      normalized,
    )
  ) {
    throw new SalesValidationError(
      `${label} harus lebih dari 0.`,
    );
  }

  return num.toFixed(2);
}

function isValidDateString(
  value: string,
): boolean {
  if (
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

function parseRequiredDate(
  value: string,
  label: string,
): Date {
  if (!isValidDateString(value)) {
    throw new SalesValidationError(
      `${label} tidak valid.`,
    );
  }

  return parseDateOnly(value);
}

function normalizeQuantityKg(
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
    throw new SalesValidationError(
      "Jumlah telur harus lebih dari 0 kg dengan maksimal 3 angka desimal.",
    );
  }

  const [
    whole,
    fraction = "",
  ] = normalized.split(".");

  const normalizedFraction =
    fraction.replace(
      /0+$/,
      "",
    );

  return normalizedFraction
    ? `${whole}.${normalizedFraction}`
    : whole;
}

function getDefaultOrderFromDate(
  to: string,
): string {
  const date =
    parseDateOnly(to);

  date.setUTCDate(
    date.getUTCDate() - 29,
  );

  return date
    .toISOString()
    .slice(0, 10);
}

function optionalPhone(
  value: string,
  label: string,
): string | null {
  const normalized =
    value.trim();

  if (!normalized) {
    return null;
  }

  if (
    normalized.length > 30
  ) {
    throw new SalesValidationError(
      `${label} maksimal 30 karakter.`,
    );
  }

  if (
    !/^[0-9+\-\s()]+$/.test(
      normalized,
    )
  ) {
    throw new SalesValidationError(
      `${label} hanya boleh berisi angka dan simbol (+, -, ()).`,
    );
  }

  return normalized;
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

    phone: optionalPhone(
      input.phone ?? "",
      "Nomor telepon",
    ),

    address: optionalText(
      input.address ?? "",
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
      parseRequiredDate(
        input.effectiveAt,
        "Tanggal berlaku",
      ),
  };
}

export function parseOrderInput(
  input: OrderInput,
) {
  const customerId =
    requiredText(
      input.customerId,
      "Customer",
      100,
    );

  return {
    customerId,

    orderedAt:
      parseRequiredDate(
        input.orderedAt,
        "Tanggal order",
      ),

    orderedAtString:
      input.orderedAt,

    quantityKg:
      normalizeQuantityKg(
        input.quantityKg,
      ),

    note: optionalText(
      input.note,
      "Catatan",
      1000,
    ),
  };
}

export function parseOrderPricingPreviewInput(
  input: OrderPricingPreviewInput,
) {
  return {
    customerId:
      requiredText(
        input.customerId,
        "Customer",
        100,
      ),

    orderedAt:
      parseRequiredDate(
        input.orderedAt,
        "Tanggal order",
      ),
  };
}

export function parseOrderFilters(
  input: {
    from?: string;
    to?: string;
    customerId?: string;
  },
): OrderFilters {
  const today =
    getJakartaTodayString();

  const to =
    input.to &&
    isValidDateString(input.to)
      ? input.to
      : today;

  let from =
    input.from &&
    isValidDateString(input.from)
      ? input.from
      : getDefaultOrderFromDate(
          to,
        );

  if (from > to) {
    from = to;
  }

  return {
    from,
    to,

    customerId:
      input.customerId?.trim() ??
      "",
  };
}