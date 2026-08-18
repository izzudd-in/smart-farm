export const productionReportSelect = {
  id: true,
  date: true,

  saleableEgg: true,
  damagedEgg: true,
  feedUsed: true,
  mortality: true,

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
      initialPopulation: true,
    },
  },
} as const;