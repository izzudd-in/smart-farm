export type DailyReportStatus =
  | "NOT_STARTED"
  | "INCOMPLETE"
  | "COMPLETE";

export type DailyReportFormInput = {
  kandangId: string;
  saleableEgg: string;
  damagedEgg: string;
  feedUsed: string;
  mortality: string;
  incidentalExpense: string;
  incidentNote: string;
};

export type DailyReportActionResult =
  | {
      success: true;
      message: string;
      status: DailyReportStatus;
    }
  | {
      success: false;
      error: string;
    };

export type DailyReportView = {
  id: string;
  date: string;

  kandangId: string;
  kandangCode: string;
  kandangName: string;

  flockId: string;
  flockName: string;
  flockStartDate: string;

  operatorId: string;
  operatorName: string;

  saleableEgg: number | null;
  damagedEgg: number | null;
  feedUsed: number | null;
  mortality: number | null;

  incidentalExpense: string | null;
  incidentNote: string | null;

  status: DailyReportStatus;
};

export type OperatorTodayKandang = {
  id: string;
  code: string;
  name: string;

  flock: {
    id: string;
    name: string;
    startDate: string;
  };

  report: DailyReportView | null;
  status: DailyReportStatus;

  isEditable: boolean;
  readOnlyReason: string | null;
};

export type OperatorTodayData = {
  date: string;
  operatorId: string;
  operatorName: string;
  kandangs: OperatorTodayKandang[];
};

export type OwnerDailyStatusFilter =
  | "ALL"
  | DailyReportStatus;

export type OwnerDailyFilters = {
  date: string;
  kandangId: string;
  status: OwnerDailyStatusFilter;
};

export type OwnerDailyKandangOption = {
  id: string;
  code: string;
  name: string;
};

export type OwnerDailyRow = {
  kandangId: string;
  kandangCode: string;
  kandangName: string;

  flockName: string | null;
  operatorNames: string[];

  report: DailyReportView | null;
  status: DailyReportStatus;
};

export type OwnerDailySummary = {
  total: number;
  complete: number;
  incomplete: number;
  notStarted: number;
};

export type OwnerDailyData = {
  date: string;
  filters: OwnerDailyFilters;
  kandangOptions: OwnerDailyKandangOption[];
  rows: OwnerDailyRow[];
  summary: OwnerDailySummary;
};