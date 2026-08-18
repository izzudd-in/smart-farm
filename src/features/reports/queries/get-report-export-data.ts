import {
  prisma,
} from "@/lib/db/prisma";

import {
  getDailyReportStatus,
} from "@/features/daily-operations/utils/status";

import {
  DAILY_EXPENSE_CATEGORY_LABELS,
  type DailyExpenseCategoryValue,
} from "@/features/expenses/types/daily-expense";

import {
  ROUTINE_COST_CATEGORY_LABELS,
  type RoutineCostCategoryValue,
} from "@/features/expenses/types/routine-cost";

import {
  calculateRoutineCostAllocationForPeriod,
} from "@/features/expenses/utils/routine-cost-allocation";

import {
  getReportSummaryForPeriod,
} from "@/features/reports/queries/get-report-summary";

import type {
  ReportExportData,
  ReportExportDailyReport,
  ReportExportOperationExpense,
} from "@/features/reports/types/report-export";

function toDateOnly(
  value: Date,
): string {
  return value
    .toISOString()
    .slice(
      0,
      10,
    );
}

function getDailyExpenseCategoryLabel(
  category:
    | DailyExpenseCategoryValue
    | null,
): string {
  if (
    category === null
  ) {
    return "Belum Dikategorikan";
  }

  return DAILY_EXPENSE_CATEGORY_LABELS[
    category
  ];
}

export async function getReportExportDataForPeriod(
  from: Date,
  to: Date,
): Promise<ReportExportData> {
  if (
    from > to
  ) {
    throw new Error(
      "Periode export laporan tidak valid.",
    );
  }

  /*
   * Summary adalah source angka bisnis:
   * Revenue, Feed Cost, Routine allocation total,
   * Daily Expense total, HPP, Profit, dan
   * closing Inventory.
   *
   * Query di bawah hanya mengambil detail rows
   * untuk presentation workbook.
   */
  const [
    summary,
    dailyReports,
    orders,
    routineCosts,
    ownerDailyExpenses,
  ] = await Promise.all([
    getReportSummaryForPeriod(
      from,
      to,
    ),

    prisma.dailyReport.findMany({
      where: {
        date: {
          gte:
            from,

          lte:
            to,
        },

        kandang: {
          farm: {
            scope:
              "PRIMARY",
          },
        },
      },

      orderBy: [
        {
          date:
            "asc",
        },

        {
          createdAt:
            "asc",
        },
      ],

      select: {
        id:
          true,

        date:
          true,

        saleableEgg:
          true,

        damagedEgg:
          true,

        feedUsed:
          true,

        mortality:
          true,

        incidentalExpense:
          true,

        incidentalExpenseCategory:
          true,

        incidentNote:
          true,

        feedFormulaNameSnapshot:
          true,

        kandang: {
          select: {
            name:
              true,
          },
        },

        flock: {
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

        feedItems: {
          orderBy: {
            ingredientNameSnapshot:
              "asc",
          },

          select: {
            ingredientNameSnapshot:
              true,

            percentage:
              true,
          },
        },
      },
    }),

    prisma.order.findMany({
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

      orderBy: [
        {
          orderedAt:
            "asc",
        },

        {
          createdAt:
            "asc",
        },
      ],

      select: {
        id:
          true,

        orderedAt:
          true,

        customerNameSnapshot:
          true,

        quantityKg:
          true,

        basePricePerKg:
          true,

        discountPerKg:
          true,

        finalPricePerKg:
          true,

        totalPrice:
          true,

        note:
          true,
      },
    }),

    prisma.routineCost.findMany({
      where: {
        periodStart: {
          lte:
            to,
        },

        periodEnd: {
          gte:
            from,
        },

        farm: {
          scope:
            "PRIMARY",
        },
      },

      orderBy: [
        {
          periodStart:
            "asc",
        },

        {
          name:
            "asc",
        },
      ],

      select: {
        id:
          true,

        category:
          true,

        name:
          true,

        amount:
          true,

        periodStart:
          true,

        periodEnd:
          true,

        note:
          true,
      },
    }),

    prisma.dailyExpense.findMany({
      where: {
        occurredAt: {
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

      orderBy: [
        {
          occurredAt:
            "asc",
        },

        {
          createdAt:
            "asc",
        },
      ],

      select: {
        id:
          true,

        occurredAt:
          true,

        category:
          true,

        amount:
          true,

        description:
          true,
      },
    }),
  ]);

  const mappedDailyReports:
    ReportExportDailyReport[] =
      dailyReports.map(
        (
          report,
        ) => {
          const reportStatus =
            getDailyReportStatus(
              report,
            );

          return {
            id:
              report.id,

            date:
              toDateOnly(
                report.date,
              ),

            kandangName:
              report.kandang.name,

            flockName:
              report.flock.name,

            operatorName:
              report.operator.name,

            status:
              reportStatus ===
              "COMPLETE"
                ? "COMPLETE"
                : "INCOMPLETE",

            saleableEggKg:
              report.saleableEgg ===
              null
                ? null
                : String(
                    report.saleableEgg,
                  ),

            damagedEggKg:
              report.damagedEgg ===
              null
                ? null
                : String(
                    report.damagedEgg,
                  ),

            feedUsedKg:
              report.feedUsed ===
              null
                ? null
                : String(
                    report.feedUsed,
                  ),

            mortality:
              report.mortality,

            feedFormulaNameSnapshot:
              report.feedFormulaNameSnapshot,

            feedCompositionSnapshot:
              report.feedItems
                .map(
                  (
                    item,
                  ) =>
                    `${item.ingredientNameSnapshot} ${item.percentage.toString()}%`,
                )
                .join(
                  " | ",
                ),

            incidentalExpense:
              report.incidentalExpense
                ?.toString() ??
              null,

            incidentalExpenseCategoryLabel:
              report.incidentalExpenseCategory
                ? getDailyExpenseCategoryLabel(
                    report.incidentalExpenseCategory as DailyExpenseCategoryValue,
                  )
                : null,

            incidentNote:
              report.incidentNote,
          };
        },
      );

  const operationExpenses:
    ReportExportOperationExpense[] =
      dailyReports
        .filter(
          (
            report,
          ) =>
            report.incidentalExpense !==
              null &&
            report.incidentalExpense.gt(
              0,
            ),
        )
        .map(
          (
            report,
          ) => ({
            dailyReportId:
              report.id,

            occurredAt:
              toDateOnly(
                report.date,
              ),

            categoryLabel:
              getDailyExpenseCategoryLabel(
                report.incidentalExpenseCategory as
                  | DailyExpenseCategoryValue
                  | null,
              ),

            amount:
              report.incidentalExpense
                ?.toString() ??
              "0.00",

            kandangName:
              report.kandang.name,

            operatorName:
              report.operator.name,

            description:
              report.incidentNote,
          }),
        );

  return {
    summary,

    dailyReports:
      mappedDailyReports,

    orders:
      orders.map(
        (
          order,
        ) => ({
          id:
            order.id,

          orderedAt:
            toDateOnly(
              order.orderedAt,
            ),

          customerNameSnapshot:
            order.customerNameSnapshot,

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

          note:
            order.note,
        }),
      ),

    routineCosts:
      routineCosts.map(
        (
          cost,
        ) => ({
          id:
            cost.id,

          categoryLabel:
            ROUTINE_COST_CATEGORY_LABELS[
              cost.category as RoutineCostCategoryValue
            ],

          name:
            cost.name,

          amount:
            cost.amount.toString(),

          periodStart:
            toDateOnly(
              cost.periodStart,
            ),

          periodEnd:
            toDateOnly(
              cost.periodEnd,
            ),

          allocationInPeriod:
            calculateRoutineCostAllocationForPeriod({
              amount:
                cost.amount.toString(),

              periodStart:
                cost.periodStart,

              periodEnd:
                cost.periodEnd,

              from,

              to,
            }),

          note:
            cost.note,
        }),
      ),

    ownerDailyExpenses:
      ownerDailyExpenses.map(
        (
          expense,
        ) => ({
          id:
            expense.id,

          occurredAt:
            toDateOnly(
              expense.occurredAt,
            ),

          categoryLabel:
            DAILY_EXPENSE_CATEGORY_LABELS[
              expense.category as DailyExpenseCategoryValue
            ],

          amount:
            expense.amount.toString(),

          description:
            expense.description,
        }),
      ),

    operationExpenses,
  };
}