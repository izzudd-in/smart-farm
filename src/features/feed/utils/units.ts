export type FeedUnit = "kg" | "kuintal" | "ton";

export const FEED_UNIT_CONVERSIONS: Record<
  FeedUnit,
  { label: string; multiplierToKg: number }
> = {
  kg: { label: "kg", multiplierToKg: 1 },
  kuintal: { label: "kuintal (100 kg)", multiplierToKg: 100 },
  ton: { label: "ton (1.000 kg)", multiplierToKg: 1000 },
};

export function convertToKg(value: number, unit: FeedUnit): number {
  return value * FEED_UNIT_CONVERSIONS[unit].multiplierToKg;
}

export function convertFromKg(kgValue: number, targetUnit: FeedUnit): number {
  return kgValue / FEED_UNIT_CONVERSIONS[targetUnit].multiplierToKg;
}

export function formatFeedQuantityWithConversions(
  kgValue: number | string,
): string {
  const num = typeof kgValue === "string" ? Number(kgValue) : kgValue;
  if (!Number.isFinite(num)) {
    return "0 kg";
  }

  const formattedKg = num.toLocaleString("id-ID", {
    maximumFractionDigits: 2,
  });

  if (num >= 1000) {
    const ton = num / 1000;
    return `${formattedKg} kg (${ton.toLocaleString("id-ID", { maximumFractionDigits: 2 })} ton)`;
  }

  if (num >= 100) {
    const kuintal = num / 100;
    return `${formattedKg} kg (${kuintal.toLocaleString("id-ID", { maximumFractionDigits: 2 })} kuintal)`;
  }

  return `${formattedKg} kg`;
}
