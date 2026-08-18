import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  ProductionFilters,
  ProductionKandangOption,
} from "@/features/production/types/production";
import { getJakartaTodayString } from "@/features/daily-operations/utils/date";

type ProductionFiltersProps = {
  filters: ProductionFilters;
  kandangs: ProductionKandangOption[];
};

export function ProductionFiltersPanel({
  filters,
  kandangs,
}: ProductionFiltersProps) {
  return (
    <Card className="p-4">
      <form
        method="get"
        className="grid gap-3 md:grid-cols-[170px_170px_1fr_auto]"
      >
        <div>
          <label
            htmlFor="from"
            className="mb-1.5 block text-xs font-medium text-muted"
          >
            Dari
          </label>

          <input
            id="from"
            name="from"
            type="date"
            max={filters.to}
            defaultValue={
              filters.from
            }
            className="h-10 w-full rounded-[10px] border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <div>
          <label
            htmlFor="to"
            className="mb-1.5 block text-xs font-medium text-muted"
          >
            Sampai
          </label>

          <input
            id="to"
            name="to"
            type="date"
            max={
              getJakartaTodayString()
            }
            defaultValue={
              filters.to
            }
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

        <div className="flex items-end gap-2">
          <Button
            type="submit"
            size="sm"
          >
            Terapkan
          </Button>

          <Link
            href="/production"
            className="inline-flex h-9 items-center justify-center rounded-[10px] border border-border bg-white px-3 text-xs font-medium text-foreground hover:bg-[#F9FAFB]"
          >
            Reset
          </Link>
        </div>
      </form>
    </Card>
  );
}