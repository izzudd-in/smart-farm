import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/server/auth/guards";

import { getEggPriceForDate } from "@/features/sales/queries/get-egg-price-for-date";
import type {
  EggPriceView,
  SalesPageData,
} from "@/features/sales/types/sales";
import {
  getJakartaTodayDate,
  getJakartaTodayString,
} from "@/features/daily-operations/utils/date";

function mapEggPrice(
  price: {
    id: string;
    pricePerKg: {
      toString(): string;
    };
    effectiveAt: Date;
    createdAt: Date;
  },
  previousPricePerKg?: string | null,
): EggPriceView {
  return {
    id: price.id,
    pricePerKg: price.pricePerKg.toString(),
    previousPricePerKg: previousPricePerKg ?? null,
    effectiveAt: price.effectiveAt.toISOString().slice(0, 10),
    createdAt: price.createdAt.toISOString(),
    changedBy: "Owner",
  };
}

export async function getSalesPageData(): Promise<SalesPageData> {
  await requireRole(UserRole.OWNER);

  const today = getJakartaTodayDate();

  const [
    customers,
    activePrice,
    priceHistory,
  ] = await Promise.all([
    prisma.customer.findMany({
      where: {
        farm: {
          scope: "PRIMARY",
        },
      },
      orderBy: [
        {
          isActive: "desc",
        },
        {
          name: "asc",
        },
      ],
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        discountPerKg: true,
        isActive: true,
      },
    }),

    getEggPriceForDate(today),

    prisma.eggPrice.findMany({
      where: {
        farm: {
          scope: "PRIMARY",
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
      take: 50,
      select: {
        id: true,
        pricePerKg: true,
        effectiveAt: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    asOfDate: getJakartaTodayString(),
    customers: customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      discountPerKg: customer.discountPerKg.toString(),
      isActive: customer.isActive,
    })),
    activePrice: activePrice
      ? mapEggPrice(
          activePrice,
          priceHistory[1]?.pricePerKg.toString() ?? null,
        )
      : null,
    priceHistory: priceHistory.map((price, index) => {
      const prev = priceHistory[index + 1];
      return mapEggPrice(
        price,
        prev ? prev.pricePerKg.toString() : null,
      );
    }),
  };
}