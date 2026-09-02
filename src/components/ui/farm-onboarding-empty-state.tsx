import Link from "next/link";
import {
  ArrowRight,
  Bird,
  CheckCircle2,
  Circle,
  ClipboardList,
  Sparkles,
  Warehouse,
  Wheat,
} from "lucide-react";

import { Card } from "@/components/ui/card";

type FarmOnboardingEmptyStateProps = {
  hasKandangs?: boolean;
  hasFlocks?: boolean;
  hasFormulas?: boolean;
  title?: string;
  description?: string;
};

export function FarmOnboardingEmptyState({
  hasKandangs = false,
  hasFlocks = false,
  hasFormulas = false,
  title = "Selamat Datang di UdinFarm!",
  description = "Farm Anda baru saja dibuat. Ikuti 4 langkah mudah berikut untuk memulai pencatatan dan analisis produksi peternakan secara akurat.",
}: FarmOnboardingEmptyStateProps) {
  const steps = [
    {
      number: 1,
      title: "Buat Kandang Pertama",
      description: "Daftarkan unit kandang yang ada di peternakan Anda.",
      href: "/farm",
      actionLabel: "Kelola Kandang",
      icon: Warehouse,
      completed: hasKandangs,
    },
    {
      number: 2,
      title: "Daftarkan Flock Ayam",
      description: "Tentukan populasi awal ayam dan tanggal masuk flock.",
      href: "/farm",
      actionLabel: "Daftarkan Flock",
      icon: Bird,
      completed: hasFlocks,
    },
    {
      number: 3,
      title: "Siapkan Formula Pakan",
      description: "Buat formula pakan standar untuk menghitung FCR dan biaya.",
      href: "/feed",
      actionLabel: "Atur Pakan",
      icon: Wheat,
      completed: hasFormulas,
    },
    {
      number: 4,
      title: "Input Laporan Harian",
      description: "Catat hasil telur, pakan harian, dan mortalitas ayam.",
      href: "/daily",
      actionLabel: "Mulai Laporan",
      icon: ClipboardList,
      completed: false,
    },
  ];

  return (
    <Card className="p-6 md:p-8 border-primary/20 bg-gradient-to-b from-primary-soft/40 via-white to-white shadow-sm space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {title}
            </h2>
          </div>
          <p className="text-sm text-muted max-w-2xl">{description}</p>
        </div>

        <Link
          href="/farm"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-primary-hover transition-colors shrink-0"
        >
          <span>Mulai Setup Farm</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* 4-Step Checklist Grid */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.number}
              className={`flex flex-col justify-between rounded-xl border p-4 transition-all ${
                step.completed
                  ? "border-[#BBF7D0] bg-[#F0FDF4]/70"
                  : "border-border bg-white shadow-2xs hover:border-primary/40 hover:shadow-xs"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      step.completed
                        ? "bg-[#15803D] text-white"
                        : "bg-primary-soft text-primary-hover"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  {step.completed ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-[#15803D]">
                      <CheckCircle2 className="h-4 w-4" />
                      Selesai
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-muted">
                      <Circle className="h-3.5 w-3.5" />
                      Langkah {step.number}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-foreground">
                  {step.title}
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-border/50">
                <Link
                  href={step.href}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                    step.completed
                      ? "text-[#15803D] hover:underline"
                      : "text-primary-hover hover:underline"
                  }`}
                >
                  <span>{step.actionLabel}</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
