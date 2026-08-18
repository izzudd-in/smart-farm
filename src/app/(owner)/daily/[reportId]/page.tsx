import { notFound } from "next/navigation";

import { OwnerReportDetail } from "@/features/daily-operations/components/owner-report-detail";
import { getOwnerReportDetail } from "@/features/daily-operations/queries/get-owner-report-detail";

type OwnerReportDetailPageProps = {
  params: Promise<{
    reportId: string;
  }>;
};

export default async function OwnerReportDetailPage({
  params,
}: OwnerReportDetailPageProps) {
  const { reportId } =
    await params;

  const report =
    await getOwnerReportDetail(
      reportId,
    );

  if (!report) {
    notFound();
  }

  return (
    <OwnerReportDetail
      report={report}
    />
  );
}