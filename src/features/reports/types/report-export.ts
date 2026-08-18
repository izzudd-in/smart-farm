import type {
  ReportSummaryForPeriod,
} from "@/features/reports/types/report";

export type ReportExportDailyReport = {
  id: string;
  date: string;

  kandangName: string;
  flockName: string;
  operatorName: string;

  status:
    | "COMPLETE"
    | "INCOMPLETE";

  saleableEggKg:
    | string
    | null;

  damagedEggKg:
    | string
    | null;

  feedUsedKg:
    | string
    | null;

  mortality:
    | number
    | null;

  feedFormulaNameSnapshot:
    | string
    | null;

  feedCompositionSnapshot: string;

  incidentalExpense:
    | string
    | null;

  incidentalExpenseCategoryLabel:
    | string
    | null;

  incidentNote:
    | string
    | null;
};

export type ReportExportOrder = {
  id: string;
  orderedAt: string;

  customerNameSnapshot: string;

  quantityKg: string;

  basePricePerKg: string;
  discountPerKg: string;
  finalPricePerKg: string;

  totalPrice: string;

  note:
    | string
    | null;
};

export type ReportExportRoutineCost = {
  id: string;

  categoryLabel: string;
  name: string;

  amount: string;

  periodStart: string;
  periodEnd: string;

  allocationInPeriod: string;

  note:
    | string
    | null;
};

export type ReportExportOwnerDailyExpense = {
  id: string;
  occurredAt: string;

  categoryLabel: string;

  amount: string;
  description: string;
};

export type ReportExportOperationExpense = {
  dailyReportId: string;
  occurredAt: string;

  categoryLabel: string;

  amount: string;

  kandangName: string;
  operatorName: string;

  description:
    | string
    | null;
};

export type ReportExportData = {
  summary: ReportSummaryForPeriod;

  dailyReports:
    ReportExportDailyReport[];

  orders:
    ReportExportOrder[];

  routineCosts:
    ReportExportRoutineCost[];

  ownerDailyExpenses:
    ReportExportOwnerDailyExpense[];

  operationExpenses:
    ReportExportOperationExpense[];
};