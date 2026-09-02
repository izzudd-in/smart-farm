import {
  Bird,
  CheckCircle2,
  Info,
  Scale,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wheat,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import type {
  ProductionComparison,
  ProductionKpis,
} from "@/features/production/types/production";

type ProductionEfficiencySectionProps = {
  kpis: ProductionKpis;
  comparison?: ProductionComparison;
};

const formatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 2,
});

function kg(value: number | null): string {
  return value === null ? "—" : `${formatter.format(value)} kg`;
}

function getFcrAssessment(fcr: number | null) {
  if (fcr === null) {
    return {
      status: "Belum Dapat Dihitung",
      color: "text-muted bg-[#F3F4F6] border-border",
      desc: "Membutuhkan data pakan dan produksi telur terisi.",
    };
  }
  if (fcr <= 2.2) {
    return {
      status: "Sangat Efisien",
      color: "text-[#15803D] bg-[#DCFCE7] border-[#BBF7D0]",
      desc: "Konversi pakan sangat baik (≤ 2.20). Penggunaan pakan optimal.",
    };
  }
  if (fcr <= 2.45) {
    return {
      status: "Normal / Stabil",
      color: "text-[#B45309] bg-[#FEF3C7] border-[#FDE68A]",
      desc: "Konversi pakan normal (2.21 - 2.45). Performa pakan standar industri.",
    };
  }
  return {
    status: "Kurang Efisien",
    color: "text-danger bg-[#FEE2E2] border-[#FECACA]",
    desc: "FCR tinggi (> 2.45). Indikasi pakan tercecer atau produksi telur menurun.",
  };
}

function getHdAssessment(hd: number | null) {
  if (hd === null) {
    return {
      status: "Belum Dapat Dihitung",
      color: "text-muted bg-[#F3F4F6] border-border",
      desc: "Membutuhkan data telur dan estimasi ayam aktif.",
    };
  }
  if (hd >= 85) {
    return {
      status: "Performa Puncak (Peak)",
      color: "text-[#15803D] bg-[#DCFCE7] border-[#BBF7D0]",
      desc: "Produktivitas ayam sangat tinggi (≥ 85%). Kandang dalam kondisi prima.",
    };
  }
  if (hd >= 70) {
    return {
      status: "Produksi Baik (Normal)",
      color: "text-primary-hover bg-primary-soft border-primary/20",
      desc: "Produksi telur konsisten dan stabil (70% - 84.9%).",
    };
  }
  return {
    status: "Perlu Evaluasi",
    color: "text-danger bg-[#FEE2E2] border-[#FECACA]",
    desc: "Produksi di bawah 70%. Periksa kesehatan flock, pencahayaan, atau nutrisi.",
  };
}

export function ProductionEfficiencySection({
  kpis,
  comparison,
}: ProductionEfficiencySectionProps) {
  const fcrMeta = getFcrAssessment(kpis.fcr);
  const hdMeta = getHdAssessment(kpis.henDay);

  const fcrChange = comparison?.changes.fcr ?? null;
  const hdChange = comparison?.changes.henDay ?? null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="font-semibold text-foreground">
          Analisis Efisiensi & Produktivitas
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* FT-080: Analisis Efisiensi Pakan (FCR) */}
        <Card className="p-4 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E0F2FE] text-[#0284C7]">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">
                    Feed Conversion Ratio (FCR)
                  </h3>
                  <p className="text-xs text-muted">
                    Efisiensi penggunaan pakan terhadap produksi telur
                  </p>
                </div>
              </div>

              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${fcrMeta.color}`}
              >
                {fcrMeta.status}
              </span>
            </div>

            {/* FCR Score & Breakdown */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-foreground">
                {kpis.fcr !== null ? formatter.format(kpis.fcr) : "—"}
              </span>

              {fcrChange !== null ? (
                <div
                  className={`flex items-center gap-0.5 text-xs font-semibold ${
                    fcrChange < 0
                      ? "text-[#16A34A]" // FCR turun = lebih hemat/baik
                      : fcrChange > 0
                        ? "text-danger" // FCR naik = lebih boros
                        : "text-muted"
                  }`}
                >
                  {fcrChange < 0 ? (
                    <TrendingDown className="h-3.5 w-3.5" />
                  ) : fcrChange > 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : null}
                  <span>
                    {fcrChange > 0 ? `+${fcrChange}%` : `${fcrChange}%`} vs periode lalu
                  </span>
                </div>
              ) : null}
            </div>

            <p className="mt-1 text-xs text-muted">{fcrMeta.desc}</p>
          </div>

          {/* Metrics summary */}
          <div className="grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs">
            <div className="rounded-lg bg-[#F9FAFB] p-2.5">
              <div className="flex items-center gap-1 text-muted">
                <Wheat className="h-3.5 w-3.5 text-purple-600" />
                <span>Pakan Digunakan</span>
              </div>
              <p className="mt-1 font-bold text-foreground">
                {kg(kpis.feedUsed)}
              </p>
            </div>

            <div className="rounded-lg bg-[#F9FAFB] p-2.5">
              <div className="flex items-center gap-1 text-muted">
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                <span>Total Telur Dihasilkan</span>
              </div>
              <p className="mt-1 font-bold text-foreground">
                {kg(kpis.totalProduction)}
              </p>
            </div>
          </div>
        </Card>

        {/* FT-081: Performa Hen-Day (HD %) */}
        <Card className="p-4 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-hover">
                  <Bird className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">
                    Hen-Day Production (HD %)
                  </h3>
                  <p className="text-xs text-muted">
                    Produktivitas telur berdasarkan jumlah ayam produktif
                  </p>
                </div>
              </div>

              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${hdMeta.color}`}
              >
                {hdMeta.status}
              </span>
            </div>

            {/* HD Score & Breakdown */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-foreground">
                {kpis.henDay !== null ? `${kpis.henDay}%` : "—"}
              </span>

              {hdChange !== null ? (
                <div
                  className={`flex items-center gap-0.5 text-xs font-semibold ${
                    hdChange > 0
                      ? "text-[#16A34A]" // HD naik = produktivitas naik
                      : hdChange < 0
                        ? "text-danger" // HD turun = produktivitas turun
                        : "text-muted"
                  }`}
                >
                  {hdChange > 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : hdChange < 0 ? (
                    <TrendingDown className="h-3.5 w-3.5" />
                  ) : null}
                  <span>
                    {hdChange > 0 ? `+${hdChange}%` : `${hdChange}%`} vs periode lalu
                  </span>
                </div>
              ) : null}
            </div>

            <p className="mt-1 text-xs text-muted">{hdMeta.desc}</p>
          </div>

          {/* Metrics summary */}
          <div className="grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs">
            <div className="rounded-lg bg-[#F9FAFB] p-2.5">
              <div className="flex items-center gap-1 text-muted">
                <Bird className="h-3.5 w-3.5 text-primary" />
                <span>Estimasi Ayam Aktif</span>
              </div>
              <p className="mt-1 font-bold text-foreground">
                {kpis.activePopulation !== null
                  ? `${formatter.format(kpis.activePopulation)} ekor`
                  : "—"}
              </p>
            </div>

            <div className="rounded-lg bg-[#F9FAFB] p-2.5">
              <div className="flex items-center gap-1 text-muted">
                <Info className="h-3.5 w-3.5 text-amber-600" />
                <span>Est. Butir Telur</span>
              </div>
              <p className="mt-1 font-bold text-foreground">
                {kpis.totalProduction !== null
                  ? `~${formatter.format(Math.round(kpis.totalProduction * 16))} butir`
                  : "—"}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
