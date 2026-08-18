import type {
  DailyReportView,
} from "@/features/daily-operations/types/daily-report";

import type {
  DailyExpenseCategoryValue,
} from "@/features/expenses/types/daily-expense";

import {
  getDailyReportStatus,
} from "@/features/daily-operations/utils/status";

type DailyReportViewRecord = {
  id: string;
  date: Date;

  saleableEgg: number | null;
  damagedEgg: number | null;
  feedUsed: number | null;
  mortality: number | null;

  incidentalExpense: {
    toString(): string;
  } | null;

  incidentalExpenseCategory:
    DailyExpenseCategoryValue | null;

  incidentNote:
    string | null;

  feedFormulaId:
    string | null;

  feedFormulaNameSnapshot:
    string | null;

  feedItems: Array<{
    ingredientId: string;
    ingredientNameSnapshot: string;

    percentage: {
      toString(): string;
    };
  }>;

  kandang: {
    id: string;
    code: string;
    name: string;
  };

  flock: {
    id: string;
    name: string;
    startDate: Date;
  };

  operator: {
    id: string;
    name: string;
  };
};

export function mapDailyReportView(
  report: DailyReportViewRecord,
): DailyReportView {
  return {
    id:
      report.id,

    date:
      report.date
        .toISOString()
        .slice(
          0,
          10,
        ),

    kandangId:
      report.kandang.id,

    kandangCode:
      report.kandang.code,

    kandangName:
      report.kandang.name,

    flockId:
      report.flock.id,

    flockName:
      report.flock.name,

    flockStartDate:
      report.flock.startDate
        .toISOString()
        .slice(
          0,
          10,
        ),

    operatorId:
      report.operator.id,

    operatorName:
      report.operator.name,

    saleableEgg:
      report.saleableEgg,

    damagedEgg:
      report.damagedEgg,

    feedUsed:
      report.feedUsed,

    mortality:
      report.mortality,

    incidentalExpense:
      report.incidentalExpense
        ?.toString() ??
      null,

    incidentalExpenseCategory:
      report.incidentalExpenseCategory,

    incidentNote:
      report.incidentNote,

    feedFormulaId:
      report.feedFormulaId,

    feedFormulaName:
      report.feedFormulaNameSnapshot,

    feedItems:
      report.feedItems.map(
        (
          item,
        ) => ({
          ingredientId:
            item.ingredientId,

          ingredientName:
            item.ingredientNameSnapshot,

          percentage:
            item.percentage.toString(),
        }),
      ),

    status:
      getDailyReportStatus(
        report,
      ),
  };
}