import Link from "next/link";

import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bell,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  Egg,
  PackagePlus,
  Receipt,
  ShoppingCart,
  Sparkles,
  Tag,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Wallet,
  Warehouse,
  Wheat,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
} from "@/components/ui/card";

import type {
  DashboardActivity,
  DashboardActivityType,
  DashboardAlert,
  DashboardAlertSeverity,
  DashboardAlertType,
  DashboardKandangToday,
  DashboardOverview,
  DashboardProductionTrendPoint,
} from "@/features/dashboard/types/dashboard";

type OwnerDashboardProps = {
  data: DashboardOverview;
};

type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "neutral";

type KpiBadge = {
  label: string;
  variant: BadgeVariant;
};

type KpiCardProps = {
  title: string;
  value: string;
  detail: string;

  href: string;
  actionLabel: string;

  icon: LucideIcon;

  badge?: KpiBadge;

  secondaryDetail?: string;

  valueClassName?: string;

  trend?: {
    direction: "up" | "down";
    label?: string;
  };
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

function formatOptionalKg(
  value:
    | string
    | null,
): string {
  return value ===
    null
    ? "—"
    : formatKg(
        value,
      );
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

function formatShortDate(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day:
        "2-digit",

      month:
        "short",

      timeZone:
        "UTC",
    },
  ).format(
    new Date(
      `${value}T00:00:00.000Z`,
    ),
  );
}

function formatActivityTime(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day:
        "2-digit",

      month:
        "short",

      hour:
        "2-digit",

      minute:
        "2-digit",

      hour12:
        false,

      timeZone:
        "Asia/Jakarta",
    },
  ).format(
    new Date(
      value,
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
    BadgeVariant,
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
  valueClassName,
  trend,
}: KpiCardProps) {
  return (
    <Card className="flex min-w-0 flex-col p-4 shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary-soft text-primary-hover">
          <Icon className="h-[18px] w-[18px]" />
        </div>

        {badge ? (
          <span
            className={[
              "max-w-full rounded-full border px-2 py-0.5 text-[10px] font-semibold",
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

      <div className="mt-3 min-w-0">
        <p className="text-xs font-medium text-muted">
          {title}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <p
            className={[
              "break-words text-xl font-bold tracking-tight lg:text-2xl",
              valueClassName ?? "text-foreground",
            ].join(" ")}
          >
            {value}
          </p>

          {trend ? (
            <div
              className={[
                "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-semibold",
                trend.direction === "up"
                  ? "bg-[#F0FDF4] text-[#15803D]"
                  : "bg-[#FEF2F2] text-danger",
              ].join(" ")}
              title={trend.label}
            >
              {trend.direction === "up" ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trend.label ? <span>{trend.label}</span> : null}
            </div>
          ) : null}
        </div>

        <p
          className="mt-1.5 break-words text-xs leading-4 text-muted truncate"
          title={detail}
        >
          {detail}
        </p>

        {secondaryDetail ? (
          <p
            className="mt-0.5 break-words text-[11px] leading-4 text-muted truncate"
            title={secondaryDetail}
          >
            {secondaryDetail}
          </p>
        ) : null}
      </div>

      <div className="mt-auto pt-3">
        <Link
          href={href}
          className="inline-flex min-h-8 items-center gap-1.5 text-xs font-semibold text-primary-hover transition-colors hover:text-primary"
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
): KpiBadge {
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
): KpiBadge {
  const profit =
    data.estimatedProfitMonthToDate;

  if (
    profit.estimatedOperationalProfit !== null
  ) {
    const num = Number(
      profit.estimatedOperationalProfit,
    );
    if (num > 0) {
      return {
        label:
          "Untung",

        variant:
          "success",
      };
    } else if (num < 0) {
      return {
        label:
          "Rugi",

        variant:
          "danger",
      };
    } else {
      return {
        label:
          "Impas",

        variant:
          "neutral",
      };
    }
  }

  if (
    profit.status ===
    "MISSING_COST"
  ) {
    return {
      label:
        "Biaya belum lengkap",

      variant:
        "warning",
    };
  }

  return {
    label:
      "Belum ada penjualan",

    variant:
      "neutral",
  };
}

function getProfitValueClassName(
  data: DashboardOverview,
): string | undefined {
  const profit =
    data.estimatedProfitMonthToDate;

  if (
    profit.estimatedOperationalProfit !== null
  ) {
    const num = Number(
      profit.estimatedOperationalProfit,
    );
    if (num > 0) {
      return "text-[#15803D]";
    }
    if (num < 0) {
      return "text-danger";
    }
  }
  return undefined;
}

function getProfitTrend(
  data: DashboardOverview,
):
  | {
      direction:
        | "up"
        | "down";
      label?: string;
    }
  | undefined {
  const profit =
    data.estimatedProfitMonthToDate;

  if (
    profit.estimatedOperationalProfit !== null
  ) {
    const num = Number(
      profit.estimatedOperationalProfit,
    );
    if (num > 0) {
      return {
        direction:
          "up",
        label:
          "Untung",
      };
    }
    if (num < 0) {
      return {
        direction:
          "down",
        label:
          "Rugi",
      };
    }
  }
  return undefined;
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

function alertStyle(
  severity:
    DashboardAlertSeverity,
): {
  border: string;
  icon: string;
  badge: string;
} {
  switch (
    severity
  ) {
    case "CRITICAL":
      return {
        border:
          "border-[#FECACA] bg-[#FEF2F2]",

        icon:
          "text-[#B91C1C]",

        badge:
          "border-[#FECACA] bg-white text-[#B91C1C]",
      };

    case "WARNING":
      return {
        border:
          "border-[#FDE68A] bg-[#FFFBEB]",

        icon:
          "text-[#B45309]",

        badge:
          "border-[#FDE68A] bg-white text-[#92400E]",
      };

    default:
      return {
        border:
          "border-border bg-[#F9FAFB]",

        icon:
          "text-muted",

        badge:
          "border-border bg-white text-muted",
      };
  }
}

function AlertIcon({
  type,
  className,
}: {
  type?: DashboardAlertType;
  className?: string;
}) {
  switch (type) {
    case "EGG_STOCK":
      return <Egg className={className} />;
    case "FEED_STOCK":
      return <Wheat className={className} />;
    case "MORTALITY":
      return <AlertCircle className={className} />;
    case "OPERATIONS":
      return <ClipboardCheck className={className} />;
    case "COST":
      return <Wallet className={className} />;
    case "PRICE":
      return <Tag className={className} />;
    default:
      return <AlertTriangle className={className} />;
  }
}

function AlertRow({
  alert,
}: {
  alert: DashboardAlert;
}) {
  const style =
    alertStyle(
      alert.severity,
    );

  return (
    <div
      className={[
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[10px] border p-3 transition-colors",
        style.border,
      ].join(
        " ",
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div
          className={[
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-2xs",
            style.badge,
          ].join(" ")}
        >
          <AlertIcon
            type={alert.type}
            className={[
              "h-4 w-4",
              style.icon,
            ].join(" ")}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="break-words text-sm font-semibold text-foreground">
              {alert.title}
            </p>

            <span
              className={[
                "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                style.badge,
              ].join(
                " ",
              )}
            >
              {alert.severity ===
              "CRITICAL"
                ? "Kritis"
                : alert.severity ===
                    "WARNING"
                  ? "Perhatian"
                  : "Info"}
            </span>
          </div>

          <p
            className="mt-0.5 break-words text-xs leading-5 text-muted"
            title={alert.description}
          >
            {alert.description}
          </p>
        </div>
      </div>

      {alert.href &&
      alert.actionLabel ? (
        <Link
          href={alert.href}
          className="inline-flex min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-white px-3 py-1 text-xs font-semibold text-primary-hover shadow-2xs transition-colors hover:bg-primary-soft"
        >
          <span>{alert.actionLabel}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </div>
  );
}

function AlertsSection({
  alerts,
}: {
  alerts:
    DashboardAlert[];
}) {
  const criticalCount = alerts.filter(
    (a) => a.severity === "CRITICAL",
  ).length;

  return (
    <Card className="min-w-0 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-foreground">
              Notifikasi & Peringatan
            </h2>
            {alerts.length > 0 ? (
              <span
                className={[
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
                  criticalCount > 0
                    ? "border-[#FECACA] bg-[#FEF2F2] text-danger animate-pulse"
                    : "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]",
                ].join(" ")}
              >
                {alerts.length} Notifikasi
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-xs text-muted">
            Kondisi penting yang memerlukan perhatian dan tindakan manajemen.
          </p>
        </div>
      </div>

      {alerts.length >
      0 ? (
        <div className="mt-4 space-y-2">
          {alerts.map(
            (
              alert,
            ) => (
              <AlertRow
                key={
                  alert.id
                }
                alert={
                  alert
                }
              />
            ),
          )}
        </div>
      ) : (
        <div className="mt-4 flex items-start gap-3 rounded-[10px] border border-[#BBF7D0] bg-[#F0FDF4] p-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#15803D]" />

          <p className="text-sm leading-5 text-[#166534]">
            Semua sistem berjalan normal. Tidak ada kondisi abnormal atau alert aktif.
          </p>
        </div>
      )}
    </Card>
  );
}

function getKandangStatusBadge(
  kandang:
    DashboardKandangToday,
): KpiBadge {
  switch (
    kandang.reportStatus
  ) {
    case "COMPLETE":
      return {
        label:
          "Selesai",

        variant:
          "success",
      };

    case "INCOMPLETE":
      return {
        label:
          "Belum lengkap",

        variant:
          "warning",
      };

    default:
      return {
        label:
          "Belum diisi",

        variant:
          "neutral",
      };
  }
}

function KandangCard({
  kandang,
  today,
}: {
  kandang:
    DashboardKandangToday;

  today: string;
}) {
  const status =
    getKandangStatusBadge(
      kandang,
    );

  return (
    <Card className="min-w-0 p-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">
            {
              kandang.kandangName
            }
          </p>

          <p className="mt-0.5 truncate text-xs text-muted">
            {
              kandang.flockName
            }
          </p>
        </div>

        <span
          className={[
            "shrink-0 rounded-full border px-2 py-1 text-[10px] font-medium",
            badgeClass(
              status.variant,
            ),
          ].join(
            " ",
          )}
        >
          {status.label}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="min-w-0 rounded-[10px] bg-[#F9FAFB] p-2.5">
          <p className="text-[10px] text-muted">
            Telur Jual
          </p>

          <p className="mt-1 break-words text-sm font-semibold text-foreground">
            {formatOptionalKg(
              kandang.saleableEggKg,
            )}
          </p>
        </div>

        <div className="min-w-0 rounded-[10px] bg-[#F9FAFB] p-2.5">
          <p className="text-[10px] text-muted">
            Pakan
          </p>

          <p className="mt-1 break-words text-sm font-semibold text-foreground">
            {formatOptionalKg(
              kandang.feedUsedKg,
            )}
          </p>
        </div>

        <div className="min-w-0 rounded-[10px] bg-[#F9FAFB] p-2.5">
          <p className="text-[10px] text-muted">
            Mati
          </p>

          <p className="mt-1 break-words text-sm font-semibold text-foreground">
            {kandang.mortality ===
            null
              ? "—"
              : `${kandang.mortality.toLocaleString(
                  "id-ID",
                )} ekor`}
          </p>
        </div>
      </div>

      <div className="mt-3 flex min-w-0 flex-col gap-1 border-t border-border pt-3 text-xs text-muted">
        <p className="truncate">
          Operator:{" "}
          <span className="font-medium text-foreground">
            {kandang.operatorName ??
              "—"}
          </span>
        </p>

        <Link
          href={`/daily?date=${encodeURIComponent(
            today,
          )}`}
          className="inline-flex min-h-11 items-center gap-1.5 self-start font-semibold text-primary-hover hover:text-primary"
        >
          Lihat Operasional

          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Card>
  );
}

function KandangStatusSection({
  kandangs,
  today,
}: {
  kandangs:
    DashboardKandangToday[];

  today: string;
}) {
  return (
    <section className="min-w-0">
      <div className="mb-3">
        <h2 className="font-semibold text-foreground">
          Status Kandang Hari Ini
        </h2>

        <p className="mt-1 text-xs text-muted">
          Kandang aktif yang memiliki flock berjalan.
        </p>
      </div>

      {kandangs.length >
      0 ? (
        <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {kandangs.map(
            (
              kandang,
            ) => (
              <KandangCard
                key={
                  kandang.kandangId
                }
                kandang={
                  kandang
                }
                today={
                  today
                }
              />
            ),
          )}
        </div>
      ) : (
        <Card className="p-4">
          <p className="text-sm text-muted">
            Belum ada kandang aktif dengan flock berjalan.
          </p>
        </Card>
      )}
    </section>
  );
}

function getTrendStatus(
  point:
    DashboardProductionTrendPoint,
): string {
  if (
    point.completeReportCount ===
    0
  ) {
    return "Belum ada data final";
  }

  if (
    point.incompleteReportCount >
    0
  ) {
    return "Sebagian data";
  }

  return "Final";
}

function ProductionTrend({
  points,
}: {
  points:
    DashboardProductionTrendPoint[];
}) {
  const validNumbers =
    points
      .filter(
        (
          point,
        ) =>
          point.productionKg !==
          null,
      )
      .map(
        (
          point,
        ) =>
          Number(
            point.productionKg,
          ),
      )
      .filter(
        (
          value,
        ) =>
          Number.isFinite(
            value,
          ),
      );

  const maxProduction =
    validNumbers.length >
    0
      ? Math.max(
          ...validNumbers,
        )
      : 0;

  const hasFinalData =
    points.some(
      (
        point,
      ) =>
        point.productionKg !==
        null,
    );

  return (
    <Card className="min-w-0 p-4">
      <div>
        <h2 className="font-semibold text-foreground">
          Produksi 7 Hari Terakhir
        </h2>

        <p className="mt-1 text-xs text-muted">
          Telur jual dari Daily Report COMPLETE.
        </p>
      </div>

      {!hasFinalData ? (
        <div className="mt-4 rounded-[10px] border border-dashed border-border p-4">
          <p className="text-sm text-muted">
            Belum ada data produksi final dalam 7 hari terakhir.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {points.map(
            (
              point,
            ) => {
              const numeric =
                point.productionKg ===
                null
                  ? null
                  : Number(
                      point.productionKg,
                    );

              const width =
                numeric ===
                  null ||
                !Number.isFinite(
                  numeric,
                )
                  ? 0
                  : maxProduction >
                      0
                    ? Math.max(
                        2,
                        Math.min(
                          100,
                          (numeric /
                            maxProduction) *
                            100,
                        ),
                      )
                    : 2;

              const partial =
                point.completeReportCount >
                  0 &&
                point.incompleteReportCount >
                  0;

              return (
                <div
                  key={
                    point.date
                  }
                  className="grid min-w-0 grid-cols-[58px_minmax(0,1fr)_72px] items-center gap-2"
                >
                  <p className="text-xs font-medium text-muted">
                    {formatShortDate(
                      point.date,
                    )}
                  </p>

                  <div className="min-w-0">
                    {point.productionKg ===
                    null ? (
                      <div
                        aria-label={`${formatDate(
                          point.date,
                        )}: belum ada data produksi final`}
                        className="h-7 rounded-[8px] border border-dashed border-border bg-[#F9FAFB]"
                      />
                    ) : (
                      <div
                        aria-label={`${formatDate(
                          point.date,
                        )}: ${formatKg(
                          point.productionKg,
                        )}, ${getTrendStatus(
                          point,
                        )}`}
                        className="flex h-7 min-w-0 items-center rounded-[8px] bg-[#F3F4F6]"
                      >
                        <div
                          className={[
                            "h-full rounded-[8px]",
                            partial
                              ? "bg-primary/55"
                              : "bg-primary",
                          ].join(
                            " ",
                          )}
                          style={{
                            width:
                              `${width}%`,
                          }}
                        />
                      </div>
                    )}

                    <p className="mt-1 truncate text-[10px] text-muted">
                      {getTrendStatus(
                        point,
                      )}
                    </p>
                  </div>

                  <p className="min-w-0 break-words text-right text-xs font-semibold text-foreground">
                    {point.productionKg ===
                    null
                      ? "—"
                      : formatKg(
                          point.productionKg,
                        )}
                  </p>
                </div>
              );
            },
          )}
        </div>
      )}
    </Card>
  );
}

function ActivityIcon({
  type,
  className,
}: {
  type:
    DashboardActivityType;

  className?: string;
}) {
  switch (
    type
  ) {
    case "DAILY_REPORT":
      return (
        <ClipboardCheck className={className} />
      );

    case "ORDER":
      return (
        <ShoppingCart className={className} />
      );

    case "FEED_PURCHASE":
      return (
        <PackagePlus className={className} />
      );

    case "DAILY_EXPENSE":
      return (
        <Receipt className={className} />
      );

    case "EGG_STOCK_ADJUSTMENT":
      return (
        <Boxes className={className} />
      );

    case "FEED_STOCK_ADJUSTMENT":
      return (
        <Wheat className={className} />
      );
  }
}

function ActivityRow({
  activity,
}: {
  activity:
    DashboardActivity;
}) {
  const content = (
    <>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-primary-soft text-primary-hover">
        <ActivityIcon
          type={activity.type}
          className="h-4 w-4"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-semibold text-foreground">
            {activity.title}
          </p>

          <span className="shrink-0 text-[10px] font-medium text-muted">
            {formatActivityTime(
              activity.occurredAt,
            )}
          </span>
        </div>

        {activity.description ? (
          <p
            className="mt-0.5 truncate text-[11px] text-muted"
            title={activity.description}
          >
            {activity.description}
          </p>
        ) : null}
      </div>
    </>
  );

  if (
    activity.href
  ) {
    return (
      <Link
        href={
          activity.href
        }
        className="flex min-h-10 min-w-0 items-center gap-3 rounded-[8px] p-2 transition-colors hover:bg-primary-soft/40"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-[8px] p-2">
      {content}
    </div>
  );
}

function RecentActivities({
  activities,
}: {
  activities:
    DashboardActivity[];
}) {
  return (
    <Card className="min-w-0 p-4">
      <div>
        <h2 className="font-semibold text-foreground">
          Aktivitas Terbaru
        </h2>

        <p className="mt-1 text-xs text-muted">
          Perubahan terbaru dari source operasional dan bisnis.
        </p>
      </div>

      {activities.length >
      0 ? (
        <div className="mt-3 divide-y divide-border">
          {activities.map(
            (
              activity,
            ) => (
              <ActivityRow
                key={
                  activity.id
                }
                activity={
                  activity
                }
              />
            ),
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">
          Belum ada aktivitas terbaru.
        </p>
      )}
    </Card>
  );
}

function OnboardingStepIcon({
  stepNumber,
  className,
}: {
  stepNumber: number;
  className?: string;
}) {
  switch (stepNumber) {
    case 1:
      return <Warehouse className={className} />;
    case 2:
      return <UserCheck className={className} />;
    case 3:
      return <Wheat className={className} />;
    case 4:
      return <Tag className={className} />;
    default:
      return null;
  }
}

function OnboardingSection({
  onboarding,
}: {
  onboarding:
    DashboardOverview["onboarding"];
}) {
  if (
    onboarding.isCompleted
  ) {
    return null;
  }

  const steps = [
    {
      number: 1,
      title:
        "1. Setup Kandang",
      description:
        "Daftarkan unit kandang",
      href:
        "/farm",
      completed:
        onboarding.hasKandang,
    },
    {
      number: 2,
      title:
        "2. Assign Operator",
      description:
        "Tugaskan operator kandang",
      href:
        "/settings",
      completed:
        onboarding.hasOperator,
    },
    {
      number: 3,
      title:
        "3. Buat Formula Pakan",
      description:
        "Komposisi pakan harian",
      href:
        "/feed",
      completed:
        onboarding.hasFormula,
    },
    {
      number: 4,
      title:
        "4. Set Harga Telur",
      description:
        "Atur harga telur aktif",
      href:
        "/sales",
      completed:
        onboarding.hasEggPrice,
    },
  ];

  const completedCount =
    steps.filter(
      (
        s,
      ) =>
        s.completed,
    ).length;

  return (
    <Card className="min-w-0 border-primary/30 bg-gradient-to-r from-primary-soft/40 via-white to-white p-4 shadow-xs">
      <div className="flex flex-col gap-1 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />

            <h2 className="text-sm font-bold text-foreground">
              Panduan Memulai Farm (Onboarding)
            </h2>

            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary-hover">
              {completedCount}
              /4 Selesai
            </span>
          </div>

          <p className="mt-0.5 text-xs text-muted">
            Selesaikan langkah setup awal agar pencatatan operasional dan laporan analitik farm akurat.
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(
          (
            step,
          ) => (
            <Link
              key={
                step.number
              }
              href={
                step.href
              }
              className={[
                "flex items-center gap-2.5 rounded-[10px] border p-2.5 transition-all hover:shadow-xs",
                step.completed
                  ? "border-[#BBF7D0] bg-[#F0FDF4]/70 text-[#166534]"
                  : "border-border bg-white text-foreground hover:border-primary/40",
              ].join(
                " ",
              )}
            >
              <div
                className={[
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                  step.completed
                    ? "bg-[#BBF7D0] text-[#15803D]"
                    : "bg-primary-soft text-primary-hover",
                ].join(
                  " ",
                )}
              >
                {step.completed ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <OnboardingStepIcon
                    stepNumber={
                      step.number
                    }
                    className="h-3.5 w-3.5"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">
                  {
                    step.title
                  }
                </p>

                <p className="truncate text-[10px] text-muted">
                  {
                    step.description
                  }
                </p>
              </div>
            </Link>
          ),
        )}
      </div>
    </Card>
  );
}

export function OwnerDashboard({
  data,
}: OwnerDashboardProps) {
  const profit =
    data.estimatedProfitMonthToDate;

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

      <OnboardingSection
        onboarding={
          data.onboarding
        }
      />

      {/* Sticky Summary KPI Cards (UX-003) */}
      <div className="sticky top-14 md:top-0 z-20 -mx-1 px-1 py-2 bg-background/90 backdrop-blur-md transition-all">
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
              data.salesToday
                .revenue,
            )}
            detail={`${formatKg(
              data.salesToday
                .soldKg,
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
              data.eggStock
                .isNegative
                ? {
                    label:
                      "Stok negatif",

                    variant:
                      "danger",
                  }
                : Number(
                      data
                        .eggStock
                        .currentStockKg,
                    ) <
                    50
                  ? {
                      label:
                        "Stok menipis",

                      variant:
                        "warning",
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
            valueClassName={getProfitValueClassName(
              data,
            )}
            trend={getProfitTrend(
              data,
            )}
          />
        </div>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <AlertsSection
          alerts={
            data.alerts
          }
        />

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
      </div>

      <KandangStatusSection
        kandangs={
          data.kandangs
        }
        today={
          data.today
        }
      />

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(300px,2fr)]">
        <ProductionTrend
          points={
            data.productionTrend
          }
        />

        <RecentActivities
          activities={
            data.recentActivities
          }
        />
      </div>
    </div>
  );
}