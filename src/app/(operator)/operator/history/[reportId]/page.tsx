import { notFound } from "next/navigation";

import { OperatorReportDetail } from "@/features/daily-operations/components/operator-report-detail";
import { getOperatorReportDetail } from "@/features/daily-operations/queries/get-operator-report-detail";

type OperatorReportDetailPageProps = {
  params: Promise<{
    reportId: string;
  }>;
};

export default async function OperatorReportDetailPage({
  params,
}: OperatorReportDetailPageProps) {
  const { reportId } = await params;

  const report =
    await getOperatorReportDetail(
      reportId,
    );

  if (!report) {
    notFound();
  }

  return (
    <OperatorReportDetail
      report={report}
    />
  );
}