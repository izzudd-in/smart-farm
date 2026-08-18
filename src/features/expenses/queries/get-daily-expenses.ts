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
  parseDateOnly,
} from "@/features/daily-operations/utils/date";

import {
  queryDailyExpenseCostBreakdownForPeriod,
} from "@/features/expenses/queries/daily-expense-cost";

import {
  parseDailyExpenseFilters,
} from "@/features/expenses/schemas/daily-expense";

import {
  DAILY_EXPENSE_CATEGORY_LABELS,
  type DailyExpenseCategoryValue,
  type DailyExpenseView,
  type DailyExpensesData,
} from "@/features/expenses/types/daily-expense";

import {
  sumMoney,
} from "@/features/expenses/utils/routine-cost-allocation";

function getCategoryLabel(
  category:
    | DailyExpenseCategoryValue
    | null,
): string {
  return category
    ? DAILY_EXPENSE_CATEGORY_LABELS[
        category
      ]
    : "Belum Dikategorikan";
}

export async function getDailyExpenseCostForDate(
  date: Date,
): Promise<string> {
  await requireRole(
    UserRole.OWNER,
  );

  const breakdown =
    await queryDailyExpenseCostBreakdownForPeriod(
      date,
      date,
    );

  return breakdown.dailyExpenseTotal;
}

export async function getDailyExpenseCostForPeriod(
  from: Date,
  to: Date,
): Promise<string> {
  await requireRole(
    UserRole.OWNER,
  );

  const breakdown =
    await queryDailyExpenseCostBreakdownForPeriod(
      from,
      to,
    );

  return breakdown.dailyExpenseTotal;
}

export async function getDailyExpenses(
  input: {
    from?: string;
    to?: string;
    category?: string;
    source?: string;
  },
): Promise<DailyExpensesData> {
  await requireRole(
    UserRole.OWNER,
  );

  const filters =
    parseDailyExpenseFilters(
      input,
    );

  const from =
    parseDateOnly(
      filters.from,
    );

  const to =
    parseDateOnly(
      filters.to,
    );

  const includeOwner =
    filters.source !==
    "OPERATION";

  const includeOperation =
    filters.source !==
    "OWNER";

  const categoryFilter =
    filters.category ===
    "ALL"
      ? undefined
      : filters.category;

  const [
    ownerExpenses,
    operationExpenses,
  ] = await Promise.all([
    includeOwner
      ? prisma.dailyExpense.findMany({
          where: {
            occurredAt: {
              gte: from,
              lte: to,
            },

            farm: {
              scope:
                "PRIMARY",
            },

            ...(categoryFilter
              ? {
                  category:
                    categoryFilter,
                }
              : {}),
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

          select: {
            id: true,

            occurredAt:
              true,

            category:
              true,

            amount:
              true,

            description:
              true,

            createdAt:
              true,

            createdBy: {
              select: {
                name:
                  true,
              },
            },
          },
        })
      : Promise.resolve(
          [],
        ),

    includeOperation
      ? prisma.dailyReport.findMany({
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

            ...(categoryFilter
              ? {
                  incidentalExpenseCategory:
                    categoryFilter,
                }
              : {}),
          },

          orderBy: [
            {
              date:
                "desc",
            },
            {
              createdAt:
                "desc",
            },
          ],

          select: {
            id:
              true,

            date:
              true,

            incidentalExpense:
              true,

            incidentalExpenseCategory:
              true,

            incidentNote:
              true,

            createdAt:
              true,

            kandang: {
              select: {
                name:
                  true,
              },
            },

            operator: {
              select: {
                name:
                  true,
              },
            },
          },
        })
      : Promise.resolve(
          [],
        ),
  ]);

  const ownerRows:
    DailyExpenseView[] =
      ownerExpenses.map(
        (
          expense,
        ) => {
          const category =
            expense.category as DailyExpenseCategoryValue;

          return {
            id:
              `owner:${expense.id}`,

            ownerExpenseId:
              expense.id,

            source:
              "OWNER",

            occurredAt:
              expense.occurredAt
                .toISOString()
                .slice(
                  0,
                  10,
                ),

            createdAt:
              expense.createdAt.toISOString(),

            category,

            categoryLabel:
              getCategoryLabel(
                category,
              ),

            amount:
              expense.amount.toString(),

            description:
              expense.description,

            context:
              expense.createdBy.name,

            editable:
              true,
          };
        },
      );

  const operationRows:
    DailyExpenseView[] =
      operationExpenses.map(
        (
          report,
        ) => {
          const category =
            report.incidentalExpenseCategory as
              | DailyExpenseCategoryValue
              | null;

          return {
            id:
              `operation:${report.id}`,

            ownerExpenseId:
              null,

            source:
              "OPERATION",

            occurredAt:
              report.date
                .toISOString()
                .slice(
                  0,
                  10,
                ),

            createdAt:
              report.createdAt.toISOString(),

            category,

            categoryLabel:
              getCategoryLabel(
                category,
              ),

            amount:
              report.incidentalExpense
                ?.toString() ??
              "0.00",

            description:
              report.incidentNote ??
              "Pengeluaran operasional",

            context:
              `${report.kandang.name} · ${report.operator.name}`,

            editable:
              false,
          };
        },
      );

  const expenses = [
    ...ownerRows,
    ...operationRows,
  ].sort(
    (
      a,
      b,
    ) => {
      const dateOrder =
        b.occurredAt.localeCompare(
          a.occurredAt,
        );

      if (
        dateOrder !== 0
      ) {
        return dateOrder;
      }

      return b.createdAt.localeCompare(
        a.createdAt,
      );
    },
  );

  return {
    filters,

    summary: {
      total:
        sumMoney(
          expenses.map(
            (
              expense,
            ) =>
              expense.amount,
          ),
        ),

      owner:
        sumMoney(
          ownerRows.map(
            (
              expense,
            ) =>
              expense.amount,
          ),
        ),

      operation:
        sumMoney(
          operationRows.map(
            (
              expense,
            ) =>
              expense.amount,
          ),
        ),

      count:
        expenses.length,
    },

    expenses,
  };
}