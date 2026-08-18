import {
  prisma,
} from "@/lib/db/prisma";

import {
  sumMoney,
} from "@/features/expenses/utils/routine-cost-allocation";

export type DailyExpenseCostBreakdown = {
  ownerDailyExpense: string;
  operationDailyExpense: string;
  dailyExpenseTotal: string;
  uncategorizedOperationCount: number;
};

export async function queryDailyExpenseCostBreakdownForPeriod(
  from: Date,
  to: Date,
): Promise<DailyExpenseCostBreakdown> {
  if (from > to) {
    throw new Error(
      "Invalid daily expense period.",
    );
  }

  const [
    ownerExpense,
    operationExpense,
    uncategorizedOperationCount,
  ] = await Promise.all([
    prisma.dailyExpense.aggregate({
      where: {
        occurredAt: {
          gte: from,
          lte: to,
        },

        farm: {
          scope:
            "PRIMARY",
        },
      },

      _sum: {
        amount:
          true,
      },
    }),

    prisma.dailyReport.aggregate({
      where: {
        date: {
          gte: from,
          lte: to,
        },

        incidentalExpense: {
          gt: 0,
        },

        kandang: {
          farm: {
            scope:
              "PRIMARY",
          },
        },
      },

      _sum: {
        incidentalExpense:
          true,
      },
    }),

    prisma.dailyReport.count({
      where: {
        date: {
          gte: from,
          lte: to,
        },

        incidentalExpense: {
          gt: 0,
        },

        incidentalExpenseCategory:
          null,

        kandang: {
          farm: {
            scope:
              "PRIMARY",
          },
        },
      },
    }),
  ]);

  const ownerDailyExpense =
    ownerExpense._sum.amount
      ?.toString() ??
    "0.00";

  const operationDailyExpense =
    operationExpense._sum.incidentalExpense
      ?.toString() ??
    "0.00";

  return {
    ownerDailyExpense,

    operationDailyExpense,

    dailyExpenseTotal:
      sumMoney([
        ownerDailyExpense,
        operationDailyExpense,
      ]),

    uncategorizedOperationCount,
  };
}