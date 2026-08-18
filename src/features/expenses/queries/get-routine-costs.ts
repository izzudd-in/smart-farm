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
  parseRoutineCostFilters,
} from "@/features/expenses/schemas/routine-cost";

import {
  ROUTINE_COST_CATEGORY_LABELS,
  type RoutineCostCategoryValue,
  type RoutineCostsData,
} from "@/features/expenses/types/routine-cost";

import {
  calculateRoutineCostAllocationForPeriod,
  calculateRoutineCostDailyAllocation,
  sumMoney,
} from "@/features/expenses/utils/routine-cost-allocation";

async function queryRoutineCostAllocation(
  from: Date,
  to: Date,
): Promise<string> {
  if (from > to) {
    throw new Error(
      "Invalid allocation range.",
    );
  }

  const costs =
    await prisma.routineCost.findMany({
      where: {
        farm: {
          scope:
            "PRIMARY",
        },

        periodStart: {
          lte: to,
        },

        periodEnd: {
          gte: from,
        },
      },

      select: {
        amount: true,
        periodStart:
          true,
        periodEnd:
          true,
      },
    });

  return sumMoney(
    costs.map(
      (cost) =>
        calculateRoutineCostAllocationForPeriod(
          {
            amount:
              cost.amount.toString(),

            periodStart:
              cost.periodStart,

            periodEnd:
              cost.periodEnd,

            from,
            to,
          },
        ),
    ),
  );
}

export async function getRoutineCostAllocationForDate(
  date: Date,
): Promise<string> {
  await requireRole(
    UserRole.OWNER,
  );

  return queryRoutineCostAllocation(
    date,
    date,
  );
}

export async function getRoutineCostAllocationForPeriod(
  from: Date,
  to: Date,
): Promise<string> {
  await requireRole(
    UserRole.OWNER,
  );

  return queryRoutineCostAllocation(
    from,
    to,
  );
}

export async function getRoutineCosts(
  input: {
    from?: string;
    to?: string;
  },
): Promise<RoutineCostsData> {
  await requireRole(
    UserRole.OWNER,
  );

  const filters =
    parseRoutineCostFilters(
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

  const costs =
    await prisma.routineCost.findMany({
      where: {
        farm: {
          scope:
            "PRIMARY",
        },

        // Overlap:
        // cost.start <= filter.to
        // cost.end >= filter.from
        periodStart: {
          lte: to,
        },

        periodEnd: {
          gte: from,
        },
      },

      orderBy: [
        {
          periodStart:
            "desc",
        },
        {
          name:
            "asc",
        },
      ],

      select: {
        id: true,
        name: true,
        category:
          true,
        amount: true,
        periodStart:
          true,
        periodEnd:
          true,
        note: true,

        createdBy: {
          select: {
            name: true,
          },
        },
      },
    });

  const rows =
    costs.map(
      (cost) => {
        const amount =
          cost.amount.toString();

        const category =
          cost.category as RoutineCostCategoryValue;

        return {
          id:
            cost.id,

          name:
            cost.name,

          category,

          categoryLabel:
            ROUTINE_COST_CATEGORY_LABELS[
              category
            ],

          amount,

          periodStart:
            cost.periodStart
              .toISOString()
              .slice(
                0,
                10,
              ),

          periodEnd:
            cost.periodEnd
              .toISOString()
              .slice(
                0,
                10,
              ),

          dailyAllocation:
            calculateRoutineCostDailyAllocation(
              {
                amount,

                periodStart:
                  cost.periodStart,

                periodEnd:
                  cost.periodEnd,
              },
            ),

          allocationInFilter:
            calculateRoutineCostAllocationForPeriod(
              {
                amount,

                periodStart:
                  cost.periodStart,

                periodEnd:
                  cost.periodEnd,

                from,
                to,
              },
            ),

          note:
            cost.note,

          createdByName:
            cost.createdBy.name,
        };
      },
    );

  return {
    filters,

    summary: {
      originalAmount:
        sumMoney(
          rows.map(
            (row) =>
              row.amount,
          ),
        ),

      allocatedAmount:
        sumMoney(
          rows.map(
            (row) =>
              row.allocationInFilter,
          ),
        ),

      componentCount:
        rows.length,
    },

    costs:
      rows,
  };
}