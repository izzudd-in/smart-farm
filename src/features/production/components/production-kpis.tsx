import {
  Bird,
  CircleCheckBig,
  Egg,
  TriangleAlert,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import type { ProductionKpis } from "@/features/production/types/production";

type ProductionKpisProps = {
  kpis: ProductionKpis;
};

const formatter =
  new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  });

function formatKg(
  value: number | null,
): string {
  return value === null
    ? "—"
    : `${formatter.format(
        value,
      )} kg`;
}

function formatBirds(
  value: number | null,
): string {
  return value === null
    ? "—"
    : formatter.format(value);
}

export function ProductionKpiCards({
  kpis,
}: ProductionKpisProps) {
  const items = [
    {
      label: "Total Produksi",
      value: formatKg(
        kpis.totalProduction,
      ),
      icon: Egg,
    },
    {
      label: "Telur Jual",
      value: formatKg(
        kpis.saleableEgg,
      ),
      icon: CircleCheckBig,
    },
    {
      label: "Telur Rusak",
      value: formatKg(
        kpis.damagedEgg,
      ),
      icon: TriangleAlert,
    },
    {
      label: "Ayam Aktif",
      value: formatBirds(
        kpis.activePopulation,
      ),
      icon: Bird,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Card
            key={item.label}
            className="min-w-0 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-xs text-muted">
                  {item.label}
                </p>

                <p className="mt-1 truncate text-xl font-semibold text-foreground sm:text-2xl">
                  {item.value}
                </p>
              </div>

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-hover">
                <Icon className="h-4 w-4" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}