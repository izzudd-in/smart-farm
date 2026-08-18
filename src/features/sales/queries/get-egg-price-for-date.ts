import { prisma } from "@/lib/db/prisma";

export async function getEggPriceForDate(
  date: Date,
) {
  return prisma.eggPrice.findFirst({
    where: {
      farm: {
        scope: "PRIMARY",
      },

      effectiveAt: {
        lte: date,
      },
    },

    orderBy: [
      {
        effectiveAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],

    select: {
      id: true,
      pricePerKg: true,
      effectiveAt: true,
      createdAt: true,
    },
  });
}