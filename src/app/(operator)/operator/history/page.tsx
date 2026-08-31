import Link from "next/link";
import { Calendar, ChevronRight } from "lucide-react";

import { OperatorHistoryList } from "@/features/daily-operations/components/operator-history-list";
import { getOperatorHistory } from "@/features/daily-operations/queries/get-operator-history";

export default async function OperatorHistoryPage() {
  const reports =
    await getOperatorHistory();

  return (
    <div className="space-y-4">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs text-muted"
      >
        <Link
          href="/operator/today"
          className="hover:text-foreground transition-colors"
        >
          Hari Ini
        </Link>
        <ChevronRight className="h-3 w-3 text-muted-light" />
        <span className="font-medium text-foreground">
          Riwayat
        </span>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Riwayat
          </h1>

          <p className="mt-1 text-sm text-muted">
            Laporan harian terbaru yang pernah Anda isi.
          </p>
        </div>

        <Link
          href="/operator/today"
          className="inline-flex items-center gap-2 self-start rounded-[10px] bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover sm:self-auto"
        >
          <Calendar className="h-4 w-4" />
          Kembali ke Hari Ini
        </Link>
      </div>

      <OperatorHistoryList
        reports={reports}
      />
    </div>
  );
}