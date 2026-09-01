import {
  getJakartaTodayString,
  parseDateOnly,
} from "@/features/daily-operations/utils/date";

const quantityFormatter =
  new Intl.NumberFormat(
    "id-ID",
    {
      maximumFractionDigits: 3,
    },
  );

export function parseInventoryAsOfDate(
  value: string | undefined,
): {
  date: Date;
  dateString: string;
  today: string;
} {
  const today =
    getJakartaTodayString();

  const normalized =
    value?.trim() ?? "";

  const validFormat =
    /^\d{4}-\d{2}-\d{2}$/.test(
      normalized,
    );

  if (!validFormat) {
    return {
      date:
        parseDateOnly(today),

      dateString:
        today,

      today,
    };
  }

  const parsed =
    parseDateOnly(
      normalized,
    );

  const validDate =
    !Number.isNaN(
      parsed.getTime(),
    ) &&
    parsed
      .toISOString()
      .slice(0, 10) ===
      normalized;

  if (
    !validDate ||
    normalized > today
  ) {
    return {
      date:
        parseDateOnly(today),

      dateString:
        today,

      today,
    };
  }

  return {
    date: parsed,
    dateString:
      normalized,
    today,
  };
}

export function formatInventoryKg(
  value: string,
): string {
  const quantity =
    Number(value);

  if (
    !Number.isFinite(
      quantity,
    )
  ) {
    return "0 kg";
  }

  return `${quantityFormatter.format(
    quantity,
  )} kg`;
}

export function formatSignedInventoryKg(
  value: string,
): string {
  const quantity =
    Number(value);

  if (
    !Number.isFinite(
      quantity,
    )
  ) {
    return "0 kg";
  }

  const sign =
    quantity > 0
      ? "+"
      : "";

  return `${sign}${quantityFormatter.format(
    quantity,
  )} kg`;
}

export function formatInventoryDate(
  value: string,
): string {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    },
  ).format(
    parseDateOnly(
      value,
    ),
  );
}

export function formatFeedWeightWithConversions(
  value: string | number,
): string {
  const quantity =
    typeof value === "string"
      ? Number(value)
      : value;

  if (
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    return "0 kg";
  }

  const formattedKg =
    quantityFormatter.format(quantity);

  if (quantity >= 1000) {
    const ton = quantity / 1000;
    const kuintal = quantity / 100;
    return `${formattedKg} kg (${quantityFormatter.format(kuintal)} kw / ${quantityFormatter.format(ton)} ton)`;
  }

  if (quantity >= 100) {
    const kuintal = quantity / 100;
    return `${formattedKg} kg (${quantityFormatter.format(kuintal)} kw)`;
  }

  return `${formattedKg} kg`;
}