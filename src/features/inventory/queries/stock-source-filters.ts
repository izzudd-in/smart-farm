export function getCompleteDailyReportStockWhere(
  asOfDate: Date,
) {
  return {
    date: {
      lte: asOfDate,
    },

    saleableEgg: {
      not: null,
    },

    damagedEgg: {
      not: null,
    },

    feedUsed: {
      not: null,
    },

    mortality: {
      not: null,
    },

    kandang: {
      farm: {
        scope: "PRIMARY",
      },
    },
  };
}