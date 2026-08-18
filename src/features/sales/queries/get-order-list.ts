import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/server/auth/guards";

import type {
  OrderFilters,
  OrderListData,
  OrderView,
} from "@/features/sales/types/sales";
import { parseDateOnly } from "@/features/daily-operations/utils/date";

function mapOrder(
  order: {
    id: string;
    customerId: string;
    customerNameSnapshot: string;
    orderedAt: Date;

    quantityKg: {
      toString(): string;
    };

    basePricePerKg: {
      toString(): string;
    };

    discountPerKg: {
      toString(): string;
    };

    finalPricePerKg: {
      toString(): string;
    };

    totalPrice: {
      toString(): string;
    };

    note: string | null;
    createdAt: Date;
  },
): OrderView {
  return {
    id: order.id,

    customerId:
      order.customerId,

    customerName:
      order.customerNameSnapshot,

    orderedAt:
      order.orderedAt
        .toISOString()
        .slice(0, 10),

    quantityKg:
      order.quantityKg.toString(),

    basePricePerKg:
      order.basePricePerKg.toString(),

    discountPerKg:
      order.discountPerKg.toString(),

    finalPricePerKg:
      order.finalPricePerKg.toString(),

    totalPrice:
      order.totalPrice.toString(),

    note: order.note,

    createdAt:
      order.createdAt.toISOString(),
  };
}

export async function getOrderList(
  filters: OrderFilters,
): Promise<OrderListData> {
  await requireRole(
    UserRole.OWNER,
  );

  const orders =
    await prisma.order.findMany({
      where: {
        farm: {
          scope: "PRIMARY",
        },

        orderedAt: {
          gte:
            parseDateOnly(
              filters.from,
            ),

          lte:
            parseDateOnly(
              filters.to,
            ),
        },

        ...(filters.customerId
          ? {
              customerId:
                filters.customerId,
            }
          : {}),
      },

      orderBy: [
        {
          orderedAt: "desc",
        },
        {
          createdAt: "desc",
        },
      ],

      take: 100,

      select: {
        id: true,
        customerId: true,
        customerNameSnapshot:
          true,
        orderedAt: true,

        quantityKg: true,
        basePricePerKg: true,
        discountPerKg: true,
        finalPricePerKg: true,
        totalPrice: true,

        note: true,
        createdAt: true,
      },
    });

  return {
    filters,

    orders:
      orders.map(mapOrder),
  };
}