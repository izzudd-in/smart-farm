import Link from "next/link";

import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Egg,
  ShoppingCart,
  Tag,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
} from "@/components/ui/card";

import type {
  DashboardOverview,
} from "@/features/dashboard/types/dashboard";

type OwnerDashboardProps = {
  data: DashboardOverview;
};

type KpiCardProps = {
  title: string;
  value: string;
  detail: string;

  href: string;
  actionLabel: string;

  icon: LucideIcon;

  badge?: {
    label: string;
    variant:
      | "success"
      | "warning"
      | "danger"
      | "neutral";
  };

  secondaryDetail?: string;
};

const moneyFormatter =
  new Intl.NumberFormat(
    "id-ID",
    {
      style:
        "currency",

      currency:
        "IDR",

      maximumFractionDigits:
        2,
    },
  );

const quantityFormatter =
  new Intl.NumberFormat(
    "id-ID",
    {
      maximumFractionDigits:
        3,
    },
  );

function formatMoney(
  value: string,
): string {
  const numeric =
    Number(value);

  if (
    !Number.isFinite(
      numeric,
    )
  ) {
    return "Rp0";
  }

  return moneyFormatter.format(
    numeric,
  );
}

function formatKg(
  value: string,
): string {
  const numeric =
    Number(value);

  if (
    !Number.isFinite(
      numeric,
    )
  ) {
    return "0 kg";
  }

  return `${quantityFormatter.format(
    numeric,
  )} kg`;
}

function formatPercent(
  value: string,
): string {
  const numeric =
    Number(value);

  if (
    !Number.isFinite(
      numeric,
    )
  ) {
    return "—";
  }

  return `${numeric.toLocaleString(
    "id-ID",
    {
      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    },
  )}%`;
}

function formatDate(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",

      timeZone:
        "UTC",
    },
  ).format(
    new Date(
      `${value}T00:00:00.000Z`,
    ),
  );
}

function formatMonthToDate(
  from: string,
  to: string,
): string {
  const fromDate =
    new Date(
      `${from}T00:00:00.000Z`,
    );

  const toDate =
    new Date(
      `${to}T00:00:00.000Z`,
    );

  const fromDay =
    new Intl.DateTimeFormat(
      "id-ID",
      {
        day:
          "numeric",

        timeZone:
          "UTC",
      },
    ).format(
      fromDate,
    );

  const toLabel =
    new Intl.DateTimeFormat(
      "id-ID",
      {
        day:
          "numeric",

        month:
          "short",

        year:
          "numeric",

        timeZone:
          "UTC",
      },
    ).format(
      toDate,
    );

  return `${fromDay}–${toLabel}`;
}

function badgeClass(
  variant:
    KpiCardProps["badge"] extends
    infer Badge
      ? Badge extends {
          variant:
            infer Variant;
        }
        ? Variant
        : never
      : never,
): string {
  switch (
    variant
  ) {
    case "success":
      return "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]";

    case "warning":
      return "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]";

    case "danger":
      return "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]";

    default:
      return "border-border bg-[#F9FAFB] text-muted";
  }
}

function KpiCard({
  title,
  value,
  detail,
  href,
  actionLabel,
  icon: Icon,
  badge,
  secondaryDetail,
}: KpiCardProps) {
  return (
    <Card className="flex min-w-0 flex-col p-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary-soft text-primary-hover">
          <Icon className="h-[18px] w-[18px]" />
        </div>

        {badge ? (
          <span
            className={[
              "max-w-full rounded-full border px-2 py-1 text-[10px] font-medium",
              badgeClass(
                badge.variant,
              ),
            ].join(
              " ",
            )}
          >
            {badge.label}
          </span>
        ) : null}
      </div>

      <div className="mt-4 min-w-0">
        <p className="text-xs font-medium text-muted">
          {title}
        </p>

        <p className="mt-1 break-words text-xl font-semibold tracking-tight text-foreground lg:text-2xl">
          {value}
        </p>

        <p className="mt-2 break-words text-xs leading-5 text-muted">
          {detail}
        </p>

        {secondaryDetail ? (
          <p className="mt-1 break-words text-xs leading-5 text-muted">
            {secondaryDetail}
          </p>
        ) : null}
      </div>

      <div className="mt-auto pt-3">
        <Link
          href={href}
          className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-primary-hover hover:text-primary"
        >
          {actionLabel}

          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Card>
  );
}

function getProductionDetail(
  data: DashboardOverview,
): string {
  const production =
    data.productionToday;

  if (
    production.expectedReports ===
    0
  ) {
    return "Belum ada kandang aktif dengan flock berjalan";
  }

  if (
    production.completeReports ===
      0 &&
    production.incompleteReports ===
      0
  ) {
    return "Belum ada laporan selesai";
  }

  return `${production.completeReports}/${production.expectedReports} kandang selesai`;
}

function getProductionBadge(
  data: DashboardOverview,
): KpiCardProps["badge"] {
  const production =
    data.productionToday;

  if (
    production.expectedReports ===
    0
  ) {
    return {
      label:
        "Belum ada kandang",

      variant:
        "neutral",
    };
  }

  if (
    !production.isFinal
  ) {
    return {
      label:
        "Data belum lengkap",

      variant:
        "warning",
    };
  }

  return {
    label:
      "Lengkap",

    variant:
      "success",
  };
}

function getProfitBadge(
  data: DashboardOverview,
): KpiCardProps["badge"] {
  switch (
    data
      .estimatedProfitMonthToDate
      .status
  ) {
    case "READY":
      return {
        label:
          "Lengkap",

        variant:
          "success",
      };

    case "PROVISIONAL":
      return {
        label:
          "Sementara",

        variant:
          "warning",
      };

    case "MISSING_COST":
      return {
        label:
          "Biaya belum lengkap",

        variant:
          "danger",
      };

    case "NO_REVENUE":
      return {
        label:
          "Belum ada penjualan",

        variant:
          "neutral",
      };
  }
}

function getProfitValue(
  data: DashboardOverview,
): string {
  const profit =
    data.estimatedProfitMonthToDate;

  if (
    profit.status ===
      "MISSING_COST" ||
    profit.estimatedOperationalProfit ===
      null
  ) {
    return "Belum dapat dihitung";
  }

  return formatMoney(
    profit.estimatedOperationalProfit,
  );
}

function getProfitDetail(
  data: DashboardOverview,
): string {
  const profit =
    data.estimatedProfitMonthToDate;

  const period =
    formatMonthToDate(
      data.monthToDate.from,
      data.monthToDate.to,
    );

  if (
    profit.operationalMarginPercent ===
    null
  ) {
    return period;
  }

  return `${period} · Margin ${formatPercent(
    profit.operationalMarginPercent,
  )}`;
}

function getDataQualityText(
  data: DashboardOverview,
): {
  title: string;
  detail: string;
  hasIssue: boolean;
} {
  const quality =
    data.dataQuality;

  if (
    quality.expectedReportsToday ===
    0
  ) {
    return {
      title:
        "Belum ada kandang aktif",

      detail:
        "Tidak ada laporan operasional yang diharapkan hari ini.",

      hasIssue:
        false,
    };
  }

  const unfinished =
    quality.expectedReportsToday -
    quality.completeReportsToday;

  if (
    unfinished >
    0
  ) {
    return {
      title:
        `${unfinished} laporan hari ini belum selesai`,

      detail:
        `${quality.completeReportsToday}/${quality.expectedReportsToday} kandang sudah COMPLETE.`,

      hasIssue:
        true,
    };
  }

  if (
    quality
      .missingFeedCostReportsMonthToDate >
    0
  ) {
    return {
      title:
        "Biaya pakan historis belum lengkap",

      detail:
        `${quality.missingFeedCostReportsMonthToDate} laporan COMPLETE bulan ini masih kehilangan snapshot biaya pakan.`,

      hasIssue:
        true,
    };
  }

  return {
    title:
      `Operasional hari ini ${quality.completeReportsToday}/${quality.expectedReportsToday} selesai`,

    detail:
      "Source utama Dashboard tersedia.",

    hasIssue:
      false,
  };
}

export function OwnerDashboard({
  data,
}: OwnerDashboardProps) {
  const profit =
    data.estimatedProfitMonthToDate;

  const dataQuality =
    getDataQualityText(
      data,
    );

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Dashboard
        </h1>

        <p className="mt-1 text-sm text-muted">
          Ringkasan kondisi farm hari ini ·{" "}
          {formatDate(
            data.today,
          )}
        </p>
      </div>

      <div className="grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard
          title="Produksi Hari Ini"
          value={formatKg(
            data.productionToday
              .saleableEggKg,
          )}
          detail={getProductionDetail(
            data,
          )}
          href="/production"
          actionLabel="Lihat produksi"
          icon={Egg}
          badge={getProductionBadge(
            data,
          )}
        />

        <KpiCard
          title="Penjualan Hari Ini"
          value={formatMoney(
            data.salesToday.revenue,
          )}
          detail={`${formatKg(
            data.salesToday.soldKg,
          )} · ${data.salesToday.orderCount.toLocaleString(
            "id-ID",
          )} order`}
          href="/sales?tab=order"
          actionLabel="Lihat penjualan"
          icon={ShoppingCart}
        />

        <KpiCard
          title="Stok Telur"
          value={formatKg(
            data.eggStock
              .currentStockKg,
          )}
          detail={`Per ${formatDate(
            data.today,
          )}`}
          href="/inventory?tab=egg"
          actionLabel="Lihat stok"
          icon={Boxes}
          badge={
            data.eggStock.isNegative
              ? {
                  label:
                    "Stok negatif",

                  variant:
                    "danger",
                }
              : undefined
          }
        />

        <KpiCard
          title="Estimasi Profit Bulan Ini"
          value={getProfitValue(
            data,
          )}
          detail={getProfitDetail(
            data,
          )}
          secondaryDetail={
            profit.hppPerKg
              ? `HPP ${formatMoney(
                  profit.hppPerKg,
                )}/kg`
              : undefined
          }
          href="/hpp"
          actionLabel="Lihat HPP & Profit"
          icon={Wallet}
          badge={getProfitBadge(
            data,
          )}
        />
      </div>

      <div className="grid min-w-0 gap-3 lg:grid-cols-2">
        <Card className="min-w-0 p-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary-soft text-primary-hover">
              <Tag className="h-[18px] w-[18px]" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted">
                Harga Telur Aktif
              </p>

              {data.activeEggPrice ? (
                <>
                  <p className="mt-1 break-words text-xl font-semibold text-foreground">
                    {formatMoney(
                      data.activeEggPrice
                        .pricePerKg,
                    )}
                    <span className="ml-1 text-sm font-medium text-muted">
                      /kg
                    </span>
                  </p>

                  <p className="mt-1 text-xs text-muted">
                    Berlaku sejak{" "}
                    {formatDate(
                      data.activeEggPrice
                        .effectiveAt,
                    )}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-base font-semibold text-muted">
                  Belum ada harga aktif
                </p>
              )}

              <Link
                href="/sales"
                className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-primary-hover hover:text-primary"
              >
                Kelola harga

                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </Card>

        <Card className="min-w-0 p-4">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={[
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]",
                dataQuality.hasIssue
                  ? "bg-[#FFFBEB] text-[#B45309]"
                  : "bg-[#F0FDF4] text-[#15803D]",
              ].join(
                " ",
              )}
            >
              {dataQuality.hasIssue ? (
                <AlertTriangle className="h-[18px] w-[18px]" />
              ) : (
                <CheckCircle2 className="h-[18px] w-[18px]" />
              )}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-medium text-muted">
                Data Operasional
              </p>

              <p className="mt-1 break-words text-sm font-semibold text-foreground">
                {dataQuality.title}
              </p>

              <p className="mt-1 break-words text-xs leading-5 text-muted">
                {dataQuality.detail}
              </p>

              {data.dataQuality
                .incompleteReportsToday >
              0 ? (
                <p className="mt-1 text-xs text-muted">
                  {
                    data.dataQuality
                      .incompleteReportsToday
                  }{" "}
                  laporan sudah dimulai tetapi belum lengkap.
                </p>
              ) : null}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}