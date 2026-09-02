import {
  Bird,
  CircleCheckBig,
  Egg,
  Percent,
  Scale,
  Skull,
  TriangleAlert,
  Wheat,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import type { ProductionKpis } from "@/features/production/types/production";

type ProductionKpisProps = {
  kpis: ProductionKpis;
};

const formatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 2,
});

function formatKg(value: number | null): string {
  return value === null
    ? "—"
    : `${formatter.format(value)} kg`;
}

function formatBirds(value: number | null): string {
  return value === null ? "—" : `${formatter.format(value)} ekor`;
}

function getFcrStatus(fcr: number | null) {
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

function getHdStatus(hd: number | null) {
  if (hd === null) return null;
  if (hd >= 85) {
    return {
      label: "Puncak",
      className: "text-[#16A34A] bg-[#DCFCE7]",
    };
  }
  if (hd >= 70) {
    return {
      label: "Normal",
      className: "text-primary-hover bg-primary-soft",
    };
  }
  return {
    label: "Rendah",
    className: "text-[#DC2626] bg-[#FEE2E2]",
  };
}

export function ProductionKpiCards({ kpis }: ProductionKpisProps) {
  const fcrStatus = getFcrStatus(kpis.fcr);
  const hdStatus = getHdStatus(kpis.henDay);

  const items = [
    {
      label: "Total Produksi",
      value: formatKg(kpis.totalProduction),
      subValue: kpis.damagedPercentage !== null ? `Rusak ${kpis.damagedPercentage.toFixed(1)}%` : undefined,
      icon: Egg,
      color: "text-primary-hover bg-primary-soft",
    },
    {
      label: "Telur Layak Jual",
      value: formatKg(kpis.saleableEgg),
      subValue: kpis.totalProduction && kpis.saleableEgg ? `${((kpis.saleableEgg / kpis.totalProduction) * 100).toFixed(1)}% total` : undefined,
      icon: CircleCheckBig,
      color: "text-[#15803D] bg-[#DCFCE7]",
    },
    {
      label: "Telur Rusak",
      value: formatKg(kpis.damagedEgg),
      subValue: kpis.damagedPercentage !== null ? `${kpis.damagedPercentage.toFixed(1)}% dari produksi` : undefined,
      subValueAlert: (kpis.damagedPercentage ?? 0) > 3,
      icon: TriangleAlert,
      color: "text-[#B45309] bg-[#FEF3C7]",
    },
    {
      label: "Total Pakan",
      value: formatKg(kpis.feedUsed),
      subValue: undefined,
      icon: Wheat,
      color: "text-[#9333EA] bg-[#F3E8FF]",
    },
    {
      label: "FCR Rata-rata",
      value: kpis.fcr !== null ? formatter.format(kpis.fcr) : "—",
      subValue: fcrStatus ? fcrStatus.label : undefined,
      subValueBadge: fcrStatus?.className,
      icon: Scale,
      color: "text-[#0284C7] bg-[#E0F2FE]",
    },
    {
      label: "Hen-Day (HD %)",
      value: kpis.henDay !== null ? `${kpis.henDay}%` : "—",
      subValue: hdStatus ? hdStatus.label : undefined,
      subValueBadge: hdStatus?.className,
      icon: Percent,
      color: "text-[#0D9488] bg-[#CCFBF1]",
    },
    {
      label: "Ayam Aktif",
      value: formatBirds(kpis.activePopulation),
      subValue: undefined,
      icon: Bird,
      color: "text-primary-hover bg-primary-soft",
    },
    {
      label: "Mortalitas Periode",
      value: formatBirds(kpis.totalMortality),
      subValueAlert: (kpis.totalMortality ?? 0) > 0,
      icon: Skull,
      color: "text-danger bg-[#FEE2E2]",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.label} className="min-w-0 p-3.5 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2">
              <span className="truncate text-xs font-medium text-muted">
                {item.label}
              </span>

              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${item.color}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="mt-2 min-w-0">
              <p className="truncate text-lg font-bold text-foreground sm:text-xl">
                {item.value}
              </p>

              {item.subValue ? (
                <div className="mt-1">
                  {item.subValueBadge ? (
                    <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${item.subValueBadge}`}>
                      {item.subValue}
                    </span>
                  ) : (
                    <span className={`truncate text-[11px] ${item.subValueAlert ? "font-semibold text-danger" : "text-muted"}`}>
                      {item.subValue}
                    </span>
                  )}
                </div>
              ) : null}
            </div>
          </Card>
        );
      })}
    </div>
  );
}