import Link from "next/link";
import {
  ChevronRight,
  Warehouse,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import type {
  ProductionFilters,
  ProductionKandangSummary,
} from "@/features/production/types/production";
import { getJakartaTodayString } from "@/features/daily-operations/utils/date";

type ProductionKandangListProps = {
  kandangs: ProductionKandangSummary[];
  filters: ProductionFilters;
};

const formatter =
  new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  });

function valueKg(
  value: number | null,
): string {
  return value === null
    ? "—"
    : `${formatter.format(
        value,
      )} kg`;
}

export function ProductionKandangList({
  kandangs,
  filters,
}: ProductionKandangListProps) {
  if (kandangs.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="font-medium text-foreground">
          Tidak ada kandang.
        </p>
      </Card>
    );
  }

  const mortalityLabel =
    filters.to ===
    getJakartaTodayString()
      ? "Mati Hari Ini"
      : "Mati Tgl Akhir";

  return (
    <div>
      <h2 className="mb-3 font-semibold text-foreground">
        Per Kandang
      </h2>

      <div className="grid min-w-0 gap-3 xl:grid-cols-2">
        {kandangs.map(
          (kandang) => {
            const query =
              new URLSearchParams({
                from: filters.from,
                to: filters.to,
              });

            if (kandang.flockId) {
              query.set(
                "flock",
                kandang.flockId,
              );
            }

            return (
              <Card
                key={
                  kandang.kandangId
                }
                className="min-w-0 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary-soft text-primary-hover">
                      <Warehouse className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">
                        {
                          kandang.kandangCode
                        }{" "}
                        ·{" "}
                        {
                          kandang.kandangName
                        }
                      </p>

                      <p className="mt-1 truncate text-xs text-muted">
                        {kandang.flockName ??
                          "Belum ada flock"}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/production/${kandang.kandangId}?${query.toString()}`}
                    className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-medium text-primary-hover hover:bg-primary-soft"
                  >
                    Detail
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <p className="text-[11px] text-muted">
                      Produksi
                    </p>

                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {valueKg(
                        kandang.totalProduction,
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-muted">
                      Rusak
                    </p>

                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {valueKg(
                        kandang.damagedEgg,
                      )}
                    </p>

                    {kandang.damagedPercentage !==
                    null ? (
                      <p className="mt-0.5 text-[10px] text-muted">
                        {kandang.damagedPercentage.toFixed(
                          1,
                        )}
                        %
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <p className="text-[11px] text-muted">
                      Ayam Aktif
                    </p>

                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {kandang.estimatedPopulation ===
                      null
                        ? "—"
                        : formatter.format(
                            kandang.estimatedPopulation,
                          )}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-muted">
                      {mortalityLabel}
                    </p>

                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {kandang.mortalityOnEndDate ===
                      null
                        ? "—"
                        : formatter.format(
                            kandang.mortalityOnEndDate,
                          )}
                    </p>
                  </div>
                </div>

                {kandang.reportCount ===
                0 ? (
                  <p className="mt-4 border-t border-border pt-3 text-xs text-muted">
                    Belum ada Daily
                    Report pada periode
                    ini.
                  </p>
                ) : null}
              </Card>
            );
          },
        )}
      </div>
    </div>
  );
}