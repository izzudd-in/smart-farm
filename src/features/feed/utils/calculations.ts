type FormulaCostItem = {
  percentage: number;
  currentPricePerKg: number;
};

export function calculateFormulaCost(
  items: FormulaCostItem[],
): number | null {
  if (items.length === 0) {
    return null;
  }

  return items.reduce(
    (total, item) =>
      total +
      (item.percentage / 100) *
        item.currentPricePerKg,
    0,
  );
}

export function calculateFormulaTotalPercentage(
  items: Array<{
    percentage: number;
  }>,
): number {
  return items.reduce(
    (total, item) =>
      total + item.percentage,
    0,
  );
}