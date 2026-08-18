export const dailyReportViewSelect = {
  id: true,
  date: true,

  saleableEgg: true,
  damagedEgg: true,
  feedUsed: true,
  mortality: true,

  incidentalExpense: true,
  incidentNote: true,

  feedFormulaId: true,
  feedFormulaNameSnapshot: true,

  feedItems: {
    orderBy: {
      ingredientNameSnapshot: "asc",
    },

    select: {
      ingredientId: true,
      ingredientNameSnapshot: true,
      percentage: true,
    },
  },

  kandang: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },

  flock: {
    select: {
      id: true,
      name: true,
      startDate: true,
    },
  },

  operator: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;