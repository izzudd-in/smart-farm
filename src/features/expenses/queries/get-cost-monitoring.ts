import {
  UserRole,
} from "@/generated/prisma/enums";

import {
  requireRole,
} from "@/server/auth/guards";

import {
  queryDailyExpenseCostBreakdownForPeriod,
} from "@/features/expenses/queries/daily-expense-cost";

import {
  getRoutineCostAllocationForPeriod,
} from "@/features/expenses/queries/get-routine-costs";

import {
  sumMoney,
} from "@/features/expenses/utils/routine-cost-allocation";

export type CostMonitoringForPeriod = {
  routineAllocation: string;

  ownerDailyExpense: string;
  operationDailyExpense: string;
  dailyExpenseTotal: string;

  totalNonFeedCost: string;

  uncategorizedOperationCount: number;
};

export async function getCostMonitoringForPeriod(
  from: Date,
  to: Date,
): Promise<CostMonitoringForPeriod> {
  await requireRole(
    UserRole.OWNER,
  );

  if (from > to) {
    throw new Error(
      "Invalid cost monitoring period.",
    );
  }

  const [
    routineAllocation,
    dailyExpense,
  ] = await Promise.all([
    getRoutineCostAllocationForPeriod(
      from,
      to,
    ),

    queryDailyExpenseCostBreakdownForPeriod(
      from,
      to,
    ),
  ]);

  return {
    routineAllocation,

    ownerDailyExpense:
      dailyExpense.ownerDailyExpense,

    operationDailyExpense:
      dailyExpense.operationDailyExpense,

    dailyExpenseTotal:
      dailyExpense.dailyExpenseTotal,

    totalNonFeedCost:
      sumMoney([
        routineAllocation,
        dailyExpense.dailyExpenseTotal,
      ]),

    uncategorizedOperationCount:
      dailyExpense.uncategorizedOperationCount,
  };
}