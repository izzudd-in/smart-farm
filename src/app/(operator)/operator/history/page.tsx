import { OperatorHistoryList } from "@/features/daily-operations/components/operator-history-list";
import { getOperatorHistory } from "@/features/daily-operations/queries/get-operator-history";

export default async function OperatorHistoryPage() {
  const reports =
    await getOperatorHistory();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Riwayat
        </h1>

        <p className="mt-1 text-sm text-muted">
          Laporan harian terbaru yang
          pernah Anda isi.
        </p>
      </div>

      <OperatorHistoryList
        reports={reports}
      />
    </div>
  );
}