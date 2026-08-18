import {
  EggStockAdjustmentType,
  UserRole,
} from "@/generated/prisma/enums";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/server/auth/guards";

import {
  getJakartaTodayDate,
} from "@/features/daily-operations/utils/date";

import type {
  EggInventoryData,
  EggStockMovement,
  EggStockSummary,
} from "@/features/inventory/types/inventory";

import {
  milliKgToQuantity,
  quantityToMilliKg,
} from "@/features/inventory/utils/quantity";

import {
  getCompleteDailyReportStockWhere,
} from "@/features/inventory/queries/stock-source-filters";

export async function getEggStockAsOfDate(
  date: Date,
): Promise<EggStockSummary> {
  const [
    production,
    sales,
    adjustments,
    openingRecord,
  ] = await Promise.all([
    prisma.dailyReport.aggregate({
      where:
        getCompleteDailyReportStockWhere(
          date,
        ),

      _sum: {
        saleableEgg:
          true,
      },
    }),

    prisma.order.aggregate({
      where: {
        orderedAt: {
          lte: date,
        },

        farm: {
          scope:
            "PRIMARY",
        },
      },

      _sum: {
        quantityKg:
          true,
      },
    }),

    prisma.eggStockAdjustment.groupBy({
      by: ["type"],

      where: {
        occurredAt: {
          lte: date,
        },

        farm: {
          scope:
            "PRIMARY",
        },
      },

      _sum: {
        quantityKg:
          true,
      },
    }),

    prisma.eggStockAdjustment.findFirst({
      where: {
        type:
          EggStockAdjustmentType.OPENING,

        farm: {
          scope:
            "PRIMARY",
        },
      },

      select: {
        id: true,
      },
    }),
  ]);

  const productionKg =
    quantityToMilliKg(
      production._sum
        .saleableEgg ?? 0,
    );

  const salesKg =
    quantityToMilliKg(
      sales._sum
        .quantityKg
        ?.toString() ??
        "0",
    );

  let openingKg = BigInt(0);
  let increaseKg = BigInt(0);
  let decreaseKg = BigInt(0);

  for (
    const adjustment
    of adjustments
  ) {
    const quantity =
      quantityToMilliKg(
        adjustment._sum
          .quantityKg
          ?.toString() ??
          "0",
      );

    switch (
      adjustment.type
    ) {
      case EggStockAdjustmentType.OPENING:
        openingKg +=
          quantity;
        break;

      case EggStockAdjustmentType.INCREASE:
        increaseKg +=
          quantity;
        break;

      case EggStockAdjustmentType.DECREASE:
        decreaseKg +=
          quantity;
        break;
    }
  }

  const adjustmentNetKg =
    increaseKg -
    decreaseKg;

  const currentStockKg =
    openingKg +
    productionKg -
    salesKg +
    adjustmentNetKg;

  return {
    asOfDate:
      date
        .toISOString()
        .slice(0, 10),

    openingKg:
      milliKgToQuantity(
        openingKg,
      ),

    productionKg:
      milliKgToQuantity(
        productionKg,
      ),

    salesKg:
      milliKgToQuantity(
        salesKg,
      ),

    adjustmentNetKg:
      milliKgToQuantity(
        adjustmentNetKg,
      ),

    currentStockKg:
      milliKgToQuantity(
        currentStockKg,
      ),

    // Keberadaan OPENING secara global.
    // Bukan berdasarkan quantity dan bukan hanya <= as-of date.
    // Ini mencegah CTA opening kedua ketika melihat tanggal historis.
    hasOpening:
      openingRecord !== null,

    isNegative:
      currentStockKg < BigInt(0),
  };
}

export async function getEggInventoryData(
  asOfDate =
    getJakartaTodayDate(),
): Promise<EggInventoryData> {
  await requireRole(
    UserRole.OWNER,
  );

  const [
    summary,
    productionReports,
    orders,
    adjustments,
  ] = await Promise.all([
    getEggStockAsOfDate(
      asOfDate,
    ),

    prisma.dailyReport.findMany({
      where:
        getCompleteDailyReportStockWhere(
          asOfDate,
        ),

      orderBy: [
        {
          date: "desc",
        },
        {
          createdAt:
            "desc",
        },
      ],

      take: 100,

      select: {
        id: true,
        date: true,
        saleableEgg:
          true,
        createdAt:
          true,

        kandang: {
          select: {
            code: true,
            name: true,
          },
        },

        flock: {
          select: {
            name: true,
          },
        },
      },
    }),

    prisma.order.findMany({
      where: {
        orderedAt: {
          lte:
            asOfDate,
        },

        farm: {
          scope:
            "PRIMARY",
        },
      },

      orderBy: [
        {
          orderedAt:
            "desc",
        },
        {
          createdAt:
            "desc",
        },
      ],

      take: 100,

      select: {
        id: true,
        orderedAt:
          true,
        quantityKg:
          true,
        customerNameSnapshot:
          true,
        createdAt:
          true,
      },
    }),

    prisma.eggStockAdjustment.findMany({
      where: {
        occurredAt: {
          lte:
            asOfDate,
        },

        farm: {
          scope:
            "PRIMARY",
        },
      },

      orderBy: [
        {
          occurredAt:
            "desc",
        },
        {
          createdAt:
            "desc",
        },
      ],

      take: 100,

      select: {
        id: true,
        occurredAt:
          true,
        type: true,
        quantityKg:
          true,
        note: true,
        createdAt:
          true,

        createdBy: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const movements:
    EggStockMovement[] = [
      ...productionReports.map(
        (
          report,
        ): EggStockMovement => ({
          id:
            `production:${report.id}`,

          type:
            "PRODUCTION",

          direction:
            "IN",

          occurredAt:
            report.date
              .toISOString()
              .slice(
                0,
                10,
              ),

          createdAt:
            report.createdAt.toISOString(),

          title:
            `Produksi · ${report.kandang.name}`,

          subtitle:
            report.flock.name,

          quantityKg:
            milliKgToQuantity(
              quantityToMilliKg(
                report.saleableEgg ??
                  0,
              ),
            ),
        }),
      ),

      ...orders.map(
        (
          order,
        ): EggStockMovement => ({
          id:
            `sale:${order.id}`,

          type: "SALE",

          direction:
            "OUT",

          occurredAt:
            order.orderedAt
              .toISOString()
              .slice(
                0,
                10,
              ),

          createdAt:
            order.createdAt.toISOString(),

          title:
            `Penjualan · ${order.customerNameSnapshot}`,

          subtitle:
            null,

          quantityKg:
            order.quantityKg.toString(),
        }),
      ),

      ...adjustments.map(
        (
          adjustment,
        ): EggStockMovement => {
          const opening =
            adjustment.type ===
            EggStockAdjustmentType.OPENING;

          const increase =
            adjustment.type ===
            EggStockAdjustmentType.INCREASE;

          return {
            id:
              `adjustment:${adjustment.id}`,

            type:
              opening
                ? "OPENING"
                : increase
                  ? "ADJUSTMENT_IN"
                  : "ADJUSTMENT_OUT",

            direction:
              adjustment.type ===
              EggStockAdjustmentType.DECREASE
                ? "OUT"
                : "IN",

            occurredAt:
              adjustment.occurredAt
                .toISOString()
                .slice(
                  0,
                  10,
                ),

            createdAt:
              adjustment.createdAt.toISOString(),

            title:
              opening
                ? "Stok Awal"
                : increase
                  ? "Koreksi Masuk"
                  : "Koreksi Keluar",

            subtitle:
              adjustment.note ??
              adjustment.createdBy.name,

            quantityKg:
              adjustment.quantityKg.toString(),
          };
        },
      ),
    ]
      .sort(
        (a, b) => {
          const dateOrder =
            b.occurredAt.localeCompare(
              a.occurredAt,
            );

          if (
            dateOrder !==
            0
          ) {
            return dateOrder;
          }

          return b.createdAt.localeCompare(
            a.createdAt,
          );
        },
      )
      .slice(
        0,
        100,
      );

  return {
    summary,
    movements,
  };
}