import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/server/auth/guards";

import type { OrderView } from "@/features/sales/types/sales";

export async function getOrderDetail(
  orderId: string,
): Promise<OrderView | null> {
  await requireRole(
    UserRole.OWNER,
  );

  const order =
    await prisma.order.findFirst({
      where: {
        id: orderId,

        farm: {
          scope: "PRIMARY",
        },
      },

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

  if (!order) {
    return null;
  }

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