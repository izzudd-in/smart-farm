import Link from "next/link";
import {
  ChevronRight,
  Egg,
  Warehouse,
  Wheat,
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

const formatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 2,
});

function valueKg(value: number | null): string {
  return value === null ? "—" : `${formatter.format(value)} kg`;
}

function getFcrBadge(fcr: number | null) {
  if (fcr === null) return null;
  if (fcr <= 2.2) {
    return {
      label: "Efisien",
      className: "text-[#16A34A] bg-[#DCFCE7]",
    };
  }
  if (fcr <= 2.45) {
    return {
      label: "Normal",
      className: "text-[#CA8A04] bg-[#FEF9C3]",
    };
  }
  return {
    label: "Tinggi",
    className: "text-[#DC2626] bg-[#FEE2E2]",
  };
}

export function ProductionKandangList({
  kandangs,
  filters,
}: ProductionKandangListProps) {
  if (kandangs.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="font-medium text-foreground">Tidak ada data kandang.</p>
        <p className="mt-1 text-sm text-muted">
          Silakan periksa filter kandang atau hubungi administrator farm.
        </p>
      </Card>
    );
  }

  const isTodayEnd = filters.to === getJakartaTodayString();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Data Produksi Per Kandang</h2>
        <span className="text-xs text-muted">
          {kandangs.length} Kandang terdaftar
        </span>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        {kandangs.map((kandang) => {
          const query = new URLSearchParams({
            from: filters.from,
            to: filters.to,
          });

          if (kandang.flockId) {
            query.set("flock", kandang.flockId);
          }

          const fcrBadge = getFcrBadge(kandang.fcr);

          return (
            <Card
              key={kandang.kandangId}
              className="min-w-0 p-4 transition-shadow hover:shadow-md"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-primary-soft text-primary-hover">
                    <Warehouse className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-bold text-foreground">
                      {kandang.kandangCode} · {kandang.kandangName}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-muted">
                      Flock: <span className="font-medium text-[#4B5563]">{kandang.flockName ?? "Belum ada flock aktif"}</span>
                    </p>
                  </div>
                </div>

                <Link
                  href={`/production/${kandang.kandangId}?${query.toString()}`}
                  className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-primary-soft px-2.5 text-xs font-semibold text-primary-hover transition-colors hover:bg-primary/15"
                >
                  Detail
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Card Metrics Grid */}
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 sm:grid-cols-4">
                {/* Produksi */}
                <div>
                  <div className="flex items-center gap-1 text-[11px] text-muted">
                    <Egg className="h-3 w-3" />
                    <span>Produksi Total</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {valueKg(kandang.totalProduction)}
                  </p>
                  {kandang.saleableEgg !== null ? (
                    <p className="text-[10px] text-muted">
                      Jual: {valueKg(kandang.saleableEgg)}
                    </p>
                  ) : null}
                </div>

                {/* Rusak */}
                <div>
                  <p className="text-[11px] text-muted">Telur Rusak</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {valueKg(kandang.damagedEgg)}
                  </p>
                  {kandang.damagedPercentage !== null ? (
                    <p className={`text-[10px] font-medium ${kandang.damagedPercentage > 3 ? "text-danger" : "text-muted"}`}>
                      {kandang.damagedPercentage.toFixed(1)}% dari total
                    </p>
                  ) : null}
                </div>

                {/* Pakan & FCR */}
                <div>
                  <div className="flex items-center gap-1 text-[11px] text-muted">
                    <Wheat className="h-3 w-3" />
                    <span>Pakan & FCR</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {valueKg(kandang.feedUsed)}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[10px] text-muted">
                      FCR: {kandang.fcr !== null ? formatter.format(kandang.fcr) : "—"}
                    </span>
                    {fcrBadge ? (
                      <span className={`rounded px-1 py-0.2 text-[9px] font-semibold ${fcrBadge.className}`}>
                        {fcrBadge.label}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Populasi & Mortalitas */}
                <div>
                  <p className="text-[11px] text-muted">Ayam Aktif & HD</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {kandang.estimatedPopulation === null
                      ? "—"
                      : `${formatter.format(kandang.estimatedPopulation)} ekor`}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted">
                    <span>
                      HD: <b className="text-foreground">{kandang.henDay !== null ? `${kandang.henDay}%` : "—"}</b>
                    </span>
                    <span>·</span>
                    <span>
                      {isTodayEnd ? "Mati:" : "Mati:"}{" "}
                      <span className="font-medium text-danger">
                        {isTodayEnd
                          ? (kandang.mortalityOnEndDate !== null ? `${kandang.mortalityOnEndDate}` : "0")
                          : (kandang.mortalityInPeriod !== null ? `${kandang.mortalityInPeriod}` : "0")}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer status / coverage */}
              <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-[11px] text-muted">
                <span>
                  {kandang.reportCount > 0
                    ? `✓ ${kandang.reportCount} laporan harian terisi`
                    : "⚠️ Belum ada laporan harian pada periode ini"}
                </span>

                <Link
                  href={`/production/${kandang.kandangId}?${query.toString()}`}
                  className="font-medium text-primary-hover hover:underline"
                >
                  Evaluasi Lengkap →
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}