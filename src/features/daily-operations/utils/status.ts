import type {
  DailyReportStatus,
} from "@/features/daily-operations/types/daily-report";

type CoreReportValues = {
  saleableEgg: number | null;
  damagedEgg: number | null;
  feedUsed: number | null;
  mortality: number | null;
};

export function isCoreReportComplete(
  report: CoreReportValues,
): boolean {
  return (
    report.saleableEgg !== null &&
    report.damagedEgg !== null &&
    report.feedUsed !== null &&
    report.mortality !== null
  );
}

export function getDailyReportStatus(
  report: CoreReportValues | null,
): DailyReportStatus {
  if (!report) {
    return "NOT_STARTED";
  }

  return isCoreReportComplete(report)
    ? "COMPLETE"
    : "INCOMPLETE";
}

export function getDailyReportStatusLabel(
  status: DailyReportStatus,
): string {
  switch (status) {
    case "COMPLETE":
      return "Selesai";

    case "INCOMPLETE":
      return "Belum Lengkap";

    default:
      return "Belum Diisi";
  }
}