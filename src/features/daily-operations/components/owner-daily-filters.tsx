import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  OwnerDailyFilters,
  OwnerDailyKandangOption,
  OwnerDailyStatusFilter,
} from "@/features/daily-operations/types/daily-report";
import { getJakartaTodayString } from "@/features/daily-operations/utils/date";
import { getDailyReportStatusLabel } from "@/features/daily-operations/utils/status";

type OwnerDailyFiltersProps = {
  filters: OwnerDailyFilters;
  kandangs: OwnerDailyKandangOption[];
};

const STATUS_OPTIONS: OwnerDailyStatusFilter[] =
  [
    "ALL",
    "COMPLETE",
    "INCOMPLETE",
    "NOT_STARTED",
  ];

export function OwnerDailyFiltersPanel({
  filters,
  kandangs,
}: OwnerDailyFiltersProps) {
  return (
    <Card className="p-4">
      <form
        method="get"
        className="grid gap-3 md:grid-cols-[180px_1fr_180px_auto]"
      >
        <div>
          <label
            htmlFor="date"
            className="mb-1.5 block text-xs font-medium text-muted"
          >
            Tanggal
          </label>

          <input
            id="date"
            name="date"
            type="date"
            max={getJakartaTodayString()}
            defaultValue={filters.date}
            className="h-10 w-full rounded-[10px] border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <div>
          <label
            htmlFor="kandang"
            className="mb-1.5 block text-xs font-medium text-muted"
          >
            Kandang
          </label>

          <select
            id="kandang"
            name="kandang"
            defaultValue={
              filters.kandangId
            }
            className="h-10 w-full rounded-[10px] border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          >
            <option value="">
              Semua Kandang
            </option>

            {kandangs.map(
              (kandang) => (
                <option
                  key={kandang.id}
                  value={kandang.id}
                >
                  {kandang.code} ·{" "}
                  {kandang.name}
                </option>
              ),
            )}
          </select>
        </div>

        <div>
          <label
            htmlFor="status"
            className="mb-1.5 block text-xs font-medium text-muted"
          >
            Status
          </label>

          <select
            id="status"
            name="status"
            defaultValue={filters.status}
            className="h-10 w-full rounded-[10px] border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          >
            {STATUS_OPTIONS.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status === "ALL"
                    ? "Semua Status"
                    : getDailyReportStatusLabel(
                        status,
                      )}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="flex items-end gap-2">
          <Button
            type="submit"
            size="sm"
            className="flex-1 md:flex-none"
          >
            Terapkan
          </Button>

          <Link
            href="/daily"
            className="inline-flex h-9 items-center justify-center rounded-[10px] border border-border bg-white px-3 text-xs font-medium text-foreground hover:bg-[#F9FAFB]"
          >
            Reset
          </Link>
        </div>
      </form>
    </Card>
  );
}