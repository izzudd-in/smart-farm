import {
  UserRole,
} from "@/generated/prisma/enums";

import {
  prisma,
} from "@/lib/db/prisma";

import {
  requireRole,
} from "@/server/auth/guards";

import {
  getHppForPeriod,
} from "@/features/finance/queries/get-hpp";

import type {
  ProfitPeriodResult,
  ProfitStatus,
} from "@/features/finance/types/profit";

import {
  calculateAverageSellingPricePerKg,
  calculateOperationalMarginPercent,
  normalizeProfitQuantityKg,
  quantitiesDiffer,
  subtractMoney,
} from "@/features/finance/utils/profit-calculation";

import {
  moneyToCents,
} from "@/features/expenses/utils/routine-cost-allocation";

function uniqueWarnings(
  warnings: string[],
): string[] {
  return Array.from(
    new Set(
      warnings.filter(
        Boolean,
      ),
    ),
  );
}

export async function getProfitForPeriod(
  from: Date,
  to: Date,
): Promise<ProfitPeriodResult> {
  await requireRole(
    UserRole.OWNER,
  );

  if (
    from > to
  ) {
    throw new Error(
      "Periode Profit tidak valid.",
    );
  }

  /*
   * HPP hanya dihitung sekali.
   *
   * Order aggregate berjalan paralel
   * dan tidak membutuhkan Customer /
   * EggPrice karena Order sudah memiliki
   * immutable pricing snapshot.
   */
  const [
    hpp,
    orderAggregate,
  ] = await Promise.all([
    getHppForPeriod(
      from,
      to,
    ),

    prisma.order.aggregate({
      where: {
        orderedAt: {
          gte:
            from,

          lte:
            to,
        },

        farm: {
          scope:
            "PRIMARY",
        },
      },

      _sum: {
        totalPrice:
          true,

        quantityKg:
          true,
      },

      _count: {
        _all:
          true,
      },
    }),
  ]);

  const revenue =
    orderAggregate._sum
      .totalPrice
      ?.toString() ??
    "0.00";

  const soldKg =
    normalizeProfitQuantityKg(
      orderAggregate._sum
        .quantityKg
        ?.toString() ??
        "0",
    );

  const orderCount =
    orderAggregate._count
      ._all;

  const averageSellingPricePerKg =
    calculateAverageSellingPricePerKg(
      revenue,
      soldKg,
    );

  const warnings: string[] = [
    ...hpp.warnings,
  ];

  let status:
    ProfitStatus;

  let estimatedOperationalProfit:
    | string
    | null =
      null;

  let operationalMarginPercent:
    | string
    | null =
      null;

  const costMissing =
    hpp.status ===
      "MISSING_FEED_COST" ||
    hpp.totalOperationalCost ===
      null;

  if (
    costMissing
  ) {
    status =
      "MISSING_COST";

    warnings.unshift(
      "Estimasi profit belum dapat dihitung karena biaya pakan historis belum lengkap.",
    );
  } else {
    estimatedOperationalProfit =
      subtractMoney(
        revenue,
        hpp.totalOperationalCost!,
      );

    operationalMarginPercent =
      calculateOperationalMarginPercent(
        estimatedOperationalProfit,
        revenue,
      );

    const hasRevenue =
      moneyToCents(
        revenue,
      ) !== BigInt(0);

    if (
      !hasRevenue
    ) {
      status =
        "NO_REVENUE";

      warnings.unshift(
        "Belum ada penjualan pada periode ini.",
      );
    } else if (
      hpp.status ===
      "PROVISIONAL"
    ) {
      status =
        "PROVISIONAL";

      warnings.unshift(
        "Estimasi profit masih sementara karena terdapat laporan operasional yang belum lengkap.",
      );
    } else if (
      hpp.status ===
      "NO_PRODUCTION"
    ) {
      /*
       * Revenue tetap valid karena berasal
       * dari Order snapshot.
       *
       * Tetapi periode tanpa production
       * tidak cukup kuat untuk dianggap
       * sebagai profit final.
       */
      status =
        "PROVISIONAL";

      warnings.unshift(
        "Terdapat penjualan tetapi tidak ada produksi telur jual pada periode ini. Penjualan kemungkinan berasal dari stok periode sebelumnya.",
      );
    } else {
      status =
        "READY";
    }
  }

  const hasProductionSalesTimingDifference =
    quantitiesDiffer(
      hpp.productionKg,
      soldKg,
    );

  return {
    from:
      hpp.from,

    to:
      hpp.to,

    revenue,

    soldKg,

    orderCount,

    averageSellingPricePerKg,

    estimatedOperationalProfit,

    operationalMarginPercent,

    status,

    warnings:
      uniqueWarnings(
        warnings,
      ),

    hasProductionSalesTimingDifference,

    hpp,
  };
}