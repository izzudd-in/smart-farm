"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Calculator,
  Calendar,
  CheckCircle2,
  CircleDashed,
  Info,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getJakartaTodayString,
  parseDateOnly,
} from "@/features/daily-operations/utils/date";
import type {
  DailyHppBreakdown,
  HppStatus,
} from "@/features/finance/types/hpp";
import type {
  ProfitPeriodResult,
  ProfitStatus,
} from "@/features/finance/types/profit";

type HppMonitoringProps = {
  data: ProfitPeriodResult;
};

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 2,
});

const quantityFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 3,
});

function formatMoney(value: string | null): string {
  if (value === null) {
    return "Belum dapat dihitung";
  }

  const numeric = Number(value);
  return currencyFormatter.format(
    Number.isFinite(numeric) ? numeric : 0,
  );
}

function formatKg(value: string): string {
  const numeric = Number(value);
  return `${quantityFormatter.format(
    Number.isFinite(numeric) ? numeric : 0,
  )} kg`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function getHppStatusMeta(status: HppStatus) {
  switch (status) {
    case "READY":
      return {
        label: "Data Lengkap",
        className: "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]",
      };
    case "PROVISIONAL":
      return {
        label: "Data Sementara",
        className: "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]",
      };
    case "MISSING_FEED_COST":
      return {
        label: "Biaya Pakan Belum Lengkap",
        className: "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]",
      };
    case "NO_PRODUCTION":
      return {
        label: "Belum Ada Produksi",
        className: "border-border bg-[#F9FAFB] text-muted",
      };
  }
}

function getProfitStatusMeta(status: ProfitStatus) {
  switch (status) {
    case "READY":
      return {
        label: "Data Lengkap & Terverifikasi",
        icon: CheckCircle2,
        className: "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]",
      };
    case "PROVISIONAL":
      return {
        label: "Estimasi Sementara",
        icon: CircleDashed,
        className: "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]",
      };
    case "MISSING_COST":
      return {
        label: "Biaya Belum Lengkap",
        icon: AlertTriangle,
        className: "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]",
      };
    case "NO_REVENUE":
      return {
        label: "Belum Ada Penjualan",
        icon: Info,
        className: "border-border bg-[#F9FAFB] text-muted",
      };
  }
}

function DataQuality({ data }: { data: ProfitPeriodResult }) {
  const profitMeta = getProfitStatusMeta(data.status);
  const hppMeta = getHppStatusMeta(data.hpp.status);
  const Icon = profitMeta.icon;

  return (
    <div
      className={[
        "rounded-[10px] border p-3.5",
        profitMeta.className,
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Icon className="h-4 w-4 shrink-0" />
        <p className="text-sm font-semibold">{profitMeta.label}</p>
        <span
          className={[
            "rounded-full border px-2 py-0.5 text-[10px] font-medium",
            hppMeta.className,
          ].join(" ")}
        >
          Status HPP: {hppMeta.label}
        </span>
      </div>

      {data.warnings.length > 0 ? (
        <ul className="mt-2.5 space-y-1 pl-6 text-xs leading-5">
          {data.warnings.map((warning) => (
            <li key={warning} className="list-disc">
              {warning}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function KpiCard({
  label,
  value,
  detail,
  emphasized = false,
}: {
  label: string;
  value: string;
  detail?: string;
  emphasized?: boolean;
}) {
  return (
    <Card
      className={[
        "min-w-0 p-4",
        emphasized ? "border-primary/40 bg-primary-soft/20 shadow-xs" : "",
      ].join(" ")}
    >
      <p className="text-xs font-medium text-muted">{label}</p>
      <p
        className={[
          "mt-1 break-words text-lg font-semibold sm:text-xl",
          emphasized ? "text-primary font-bold" : "text-foreground",
        ].join(" ")}
      >
        {value}
      </p>
      {detail ? (
        <p className="mt-1 break-words text-[11px] leading-4 text-muted">
          {detail}
        </p>
      ) : null}
    </Card>
  );
}

function HppFormulaVerificationCard({ data }: { data: ProfitPeriodResult }) {
  const { hpp } = data;

  return (
    <Card className="min-w-0 overflow-hidden border-primary/20 bg-linear-to-b from-white to-[#F9FAFB] p-5">
      <div className="flex items-center gap-2 text-primary font-semibold text-sm">
        <Calculator className="h-4 w-4" />
        <span>Verifikasi Rumus & Kalkulasi HPP</span>
      </div>

      <p className="mt-1 text-xs text-muted">
        Rumus standar HPP per kg telur:
      </p>

      {/* Formula Display Box */}
      <div className="mt-3 rounded-[10px] border border-border bg-white p-3.5 text-center">
        <div className="inline-flex flex-col items-center">
          <div className="pb-1 text-xs font-semibold text-foreground sm:text-sm">
            Total Biaya Pakan + Alokasi Biaya Rutin + Pengeluaran Harian
          </div>
          <div className="h-0.5 w-full bg-foreground/40" />
          <div className="pt-1 text-xs font-semibold text-primary sm:text-sm">
            Total Produksi Telur Jual (kg)
          </div>
        </div>
      </div>

      {/* Breakdown Values for Current Period */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
        <div className="rounded-lg border border-border/80 bg-white p-2.5">
          <span className="text-muted text-[11px]">1. Biaya Pakan</span>
          <p className="font-semibold text-foreground mt-0.5">
            {formatMoney(hpp.feedCost)}
          </p>
        </div>

        <div className="rounded-lg border border-border/80 bg-white p-2.5">
          <span className="text-muted text-[11px]">2. Biaya Rutin</span>
          <p className="font-semibold text-foreground mt-0.5">
            {formatMoney(hpp.routineCost)}
          </p>
        </div>

        <div className="rounded-lg border border-border/80 bg-white p-2.5">
          <span className="text-muted text-[11px]">3. Biaya Harian</span>
          <p className="font-semibold text-foreground mt-0.5">
            {formatMoney(hpp.dailyExpenseCost)}
          </p>
        </div>

        <div className="rounded-lg border border-primary/30 bg-primary-soft/30 p-2.5">
          <span className="text-primary text-[11px] font-medium">
            4. Telur Jual
          </span>
          <p className="font-bold text-primary mt-0.5">
            {formatKg(hpp.productionKg)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs">
        <span className="text-muted">
          Total Biaya:{" "}
          <strong className="text-foreground">
            {formatMoney(hpp.totalOperationalCost)}
          </strong>
        </span>
        <span className="font-semibold text-primary">
          Hasil HPP / kg:{" "}
          <span className="text-sm font-bold">
            {hpp.hppPerKg ? `${formatMoney(hpp.hppPerKg)} / kg` : "—"}
          </span>
        </span>
      </div>
    </Card>
  );
}

function DailyRow({ day }: { day: DailyHppBreakdown }) {
  const status = getHppStatusMeta(day.status);

  return (
    <Card className="min-w-0 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 lg:w-[180px]">
          <p className="font-semibold text-foreground">
            {formatDate(day.date)}
          </p>
          <span
            className={[
              "mt-2 inline-flex rounded-full border px-2 py-1 text-[11px] font-medium",
              status.className,
            ].join(" ")}
          >
            {status.label}
          </span>
        </div>

        <div className="grid min-w-0 flex-1 grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <div className="min-w-0">
            <p className="text-[11px] text-muted">Produksi</p>
            <p className="mt-1 break-words text-sm font-medium text-foreground">
              {formatKg(day.productionKg)}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] text-muted">Pakan</p>
            <p className="mt-1 break-words text-sm font-medium text-foreground">
              {formatMoney(day.feedCost)}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] text-muted">Rutin</p>
            <p className="mt-1 break-words text-sm font-medium text-foreground">
              {formatMoney(day.routineCost)}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] text-muted">Expense</p>
            <p className="mt-1 break-words text-sm font-medium text-foreground">
              {formatMoney(day.dailyExpenseCost)}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] text-muted">Total Biaya</p>
            <p className="mt-1 break-words text-sm font-medium text-foreground">
              {formatMoney(day.totalCost)}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] text-muted">HPP / kg</p>
            <p className="mt-1 break-words text-sm font-semibold text-primary">
              {day.hppPerKg ? formatMoney(day.hppPerKg) : "—"}
            </p>
          </div>
        </div>
      </div>

      {day.warnings.length > 0 ? (
        <p className="mt-3 border-t border-border pt-3 text-xs leading-5 text-muted">
          {day.warnings.join(" ")}
        </p>
      ) : null}
    </Card>
  );
}

export function HppMonitoring({ data }: HppMonitoringProps) {
  const { hpp } = data;

  const todayStr = getJakartaTodayString();
  const [currentYear, currentMonth] = todayStr.split("-").map(Number);

  const thisMonthRange = useMemo(() => {
    const start = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
    const lastDay = new Date(
      Date.UTC(currentYear, currentMonth, 0),
    ).getUTCDate();
    const end = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return { from: start, to: end };
  }, [currentYear, currentMonth]);

  const prevMonthRange = useMemo(() => {
    const prevDate = new Date(
      Date.UTC(currentYear, currentMonth - 2, 1),
    );
    const py = prevDate.getUTCFullYear();
    const pm = prevDate.getUTCMonth() + 1;
    const start = `${py}-${String(pm).padStart(2, "0")}-01`;
    const lastDay = new Date(Date.UTC(py, pm, 0)).getUTCDate();
    const end = `${py}-${String(pm).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return { from: start, to: end };
  }, [currentYear, currentMonth]);

  const last7DaysRange = useMemo(() => {
    const today = parseDateOnly(todayStr);
    const start7 = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
    return {
      from: start7.toISOString().slice(0, 10),
      to: todayStr,
    };
  }, [todayStr]);

  const last30DaysRange = useMemo(() => {
    const today = parseDateOnly(todayStr);
    const start30 = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
    return {
      from: start30.toISOString().slice(0, 10),
      to: todayStr,
    };
  }, [todayStr]);

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          HPP & Profit
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Pantau biaya operasional, verifikasi kalkulasi HPP telur per kg, dan estimasi hasil keuangan farm.
        </p>
      </div>

      {/* Filter & Period Selection */}
      <Card className="p-4">
        <form
          method="get"
          className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="min-w-0 flex-1 sm:max-w-[190px]">
            <label
              htmlFor="hpp-from"
              className="mb-1.5 block text-xs font-medium text-muted"
            >
              Dari
            </label>
            <input
              id="hpp-from"
              name="from"
              type="date"
              defaultValue={data.from}
              className="h-11 w-full min-w-0 rounded-[10px] border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div className="min-w-0 flex-1 sm:max-w-[190px]">
            <label
              htmlFor="hpp-to"
              className="mb-1.5 block text-xs font-medium text-muted"
            >
              Sampai
            </label>
            <input
              id="hpp-to"
              name="to"
              type="date"
              defaultValue={data.to}
              className="h-11 w-full min-w-0 rounded-[10px] border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="min-h-11">
              Terapkan
            </Button>
            <Link
              href="/hpp"
              className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-border bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-[#F9FAFB]"
            >
              Reset
            </Link>
          </div>
        </form>

        {/* Quick Period Presets */}
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3 text-xs">
          <span className="text-muted flex items-center gap-1 font-medium">
            <Calendar className="h-3.5 w-3.5" />
            Preset:
          </span>
          <Link
            href={`/hpp?from=${thisMonthRange.from}&to=${thisMonthRange.to}`}
            className={[
              "rounded-lg border px-2.5 py-1 transition-colors",
              data.from === thisMonthRange.from && data.to === thisMonthRange.to
                ? "border-primary bg-primary-soft text-primary font-semibold"
                : "border-border bg-white text-muted hover:bg-[#F9FAFB] hover:text-foreground",
            ].join(" ")}
          >
            Bulan Ini
          </Link>
          <Link
            href={`/hpp?from=${prevMonthRange.from}&to=${prevMonthRange.to}`}
            className={[
              "rounded-lg border px-2.5 py-1 transition-colors",
              data.from === prevMonthRange.from && data.to === prevMonthRange.to
                ? "border-primary bg-primary-soft text-primary font-semibold"
                : "border-border bg-white text-muted hover:bg-[#F9FAFB] hover:text-foreground",
            ].join(" ")}
          >
            Bulan Lalu
          </Link>
          <Link
            href={`/hpp?from=${last7DaysRange.from}&to=${last7DaysRange.to}`}
            className={[
              "rounded-lg border px-2.5 py-1 transition-colors",
              data.from === last7DaysRange.from && data.to === last7DaysRange.to
                ? "border-primary bg-primary-soft text-primary font-semibold"
                : "border-border bg-white text-muted hover:bg-[#F9FAFB] hover:text-foreground",
            ].join(" ")}
          >
            7 Hari Terakhir
          </Link>
          <Link
            href={`/hpp?from=${last30DaysRange.from}&to=${last30DaysRange.to}`}
            className={[
              "rounded-lg border px-2.5 py-1 transition-colors",
              data.from === last30DaysRange.from && data.to === last30DaysRange.to
                ? "border-primary bg-primary-soft text-primary font-semibold"
                : "border-border bg-white text-muted hover:bg-[#F9FAFB] hover:text-foreground",
            ].join(" ")}
          >
            30 Hari Terakhir
          </Link>
        </div>
      </Card>

      <DataQuality data={data} />

      {/* Formula & Verification Section (FT-075) */}
      <HppFormulaVerificationCard data={data} />

      {/* HPP Overview Section (FT-074) */}
      <section className="space-y-3">
        <div>
          <h2 className="font-semibold text-foreground">
            HPP Operasional
          </h2>
          <p className="mt-1 text-xs text-muted">
            HPP farm-level berdasarkan produksi telur jual dan rincian biaya operasional pada periode yang sama.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <KpiCard
            label="Produksi Telur Jual"
            value={formatKg(hpp.productionKg)}
          />

          <KpiCard
            label="Total Biaya Pakan"
            value={formatMoney(hpp.feedCost)}
          />

          <KpiCard
            label="Total Biaya Operasional"
            value={formatMoney(hpp.totalOperationalCost)}
            detail={
              hpp.totalOperationalCost
                ? `Pakan ${formatMoney(hpp.feedCost)} · Rutin ${formatMoney(hpp.routineCost)} · Harian ${formatMoney(hpp.dailyExpenseCost)}`
                : `Rutin ${formatMoney(hpp.routineCost)} · Harian ${formatMoney(hpp.dailyExpenseCost)}`
            }
          />

          <KpiCard
            label="HPP Operasional / kg"
            value={
              hpp.hppPerKg
                ? formatMoney(hpp.hppPerKg)
                : "Belum dapat dihitung"
            }
            emphasized
          />
        </div>
      </section>

      {/* Profit Section (FT-074) */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-foreground">
            Profit Operasional
          </h2>
        </div>
        <p className="mt-0.5 text-xs text-muted">
          Estimasi hasil periode dari omzet dikurangi total biaya operasional periode.
        </p>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <KpiCard
            label="Omzet"
            value={formatMoney(data.revenue)}
            detail={`${data.orderCount.toLocaleString("id-ID")} order`}
          />

          <KpiCard
            label="Telur Terjual"
            value={formatKg(data.soldKg)}
          />

          <KpiCard
            label="Total Biaya Operasional"
            value={formatMoney(hpp.totalOperationalCost)}
          />

          <KpiCard
            label="Estimasi Profit Operasional"
            value={
              data.estimatedOperationalProfit === null
                ? "Belum dapat dihitung"
                : formatMoney(data.estimatedOperationalProfit)
            }
            detail={
              data.operationalMarginPercent
                ? `Margin Operasional ${data.operationalMarginPercent.replace(".", ",")}%`
                : "Margin Operasional —"
            }
            emphasized
          />
        </div>

        <Card className="p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted">Rata-rata Harga Jual</p>
              <p className="mt-1 font-semibold text-foreground">
                {data.averageSellingPricePerKg
                  ? `${formatMoney(data.averageSellingPricePerKg)} / kg`
                  : "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted">HPP Operasional</p>
              <p className="mt-1 font-semibold text-foreground">
                {hpp.hppPerKg
                  ? `${formatMoney(hpp.hppPerKg)} / kg`
                  : "—"}
              </p>
            </div>
          </div>

          {data.hasProductionSalesTimingDifference ? (
            <p className="mt-4 border-t border-border pt-3 text-xs leading-5 text-muted">
              Produksi periode dan penjualan periode tidak harus sama. Telur yang terjual dapat berasal dari stok periode sebelumnya, dan produksi periode ini dapat belum seluruhnya terjual.
            </p>
          ) : null}
        </Card>
      </section>

      {/* Daily Breakdown Section */}
      <section>
        <div className="mb-3">
          <h2 className="font-semibold text-foreground">
            Breakdown HPP Harian
          </h2>
          <p className="mt-1 text-xs text-muted">
            Rincian harian produksi, biaya pakan, biaya rutin, pengeluaran harian, dan HPP/kg setiap tanggal.
          </p>
        </div>

        <div className="space-y-3">
          {hpp.daily.map((day) => (
            <DailyRow key={day.date} day={day} />
          ))}
        </div>
      </section>
    </div>
  );
}