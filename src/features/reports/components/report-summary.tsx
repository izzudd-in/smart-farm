import {
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
} from "@/components/ui/card";

import type {
  HppStatus,
} from "@/features/finance/types/hpp";

import type {
  ProfitStatus,
} from "@/features/finance/types/profit";

import type {
  ReportSummaryForPeriod,
} from "@/features/reports/types/report";

type ReportSummaryProps = {
  data: ReportSummaryForPeriod;
};

const currencyFormatter =
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

const integerFormatter =
  new Intl.NumberFormat(
    "id-ID",
  );

function formatMoney(
  value:
    | string
    | null,
): string {
  if (
    value === null
  ) {
    return "Belum lengkap";
  }

  const numeric =
    Number(
      value,
    );

  if (
    !Number.isFinite(
      numeric,
    )
  ) {
    return "—";
  }

  return currencyFormatter.format(
    numeric,
  );
}

function formatKg(
  value: string,
): string {
  const numeric =
    Number(
      value,
    );

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
  value:
    | string
    | null,
): string {
  if (
    value === null
  ) {
    return "—";
  }

  const numeric =
    Number(
      value,
    );

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

function HppStatusBadge({
  status,
}: {
  status: HppStatus;
}) {
  const map = {
    READY: {
      label:
        "Lengkap",

      className:
        "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]",
    },

    PROVISIONAL: {
      label:
        "Sementara",

      className:
        "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]",
    },

    MISSING_FEED_COST: {
      label:
        "Biaya pakan belum lengkap",

      className:
        "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]",
    },

    NO_PRODUCTION: {
      label:
        "Tanpa produksi",

      className:
        "border-border bg-[#F9FAFB] text-muted",
    },
  } satisfies Record<
    HppStatus,
    {
      label: string;
      className: string;
    }
  >;

  const meta =
    map[
      status
    ];

  return (
    <span
      className={[
        "inline-flex rounded-full border px-2 py-1 text-[11px] font-medium",
        meta.className,
      ].join(
        " ",
      )}
    >
      {meta.label}
    </span>
  );
}

function ProfitStatusBadge({
  status,
}: {
  status: ProfitStatus;
}) {
  const map = {
    READY: {
      label:
        "Lengkap",

      className:
        "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]",
    },

    PROVISIONAL: {
      label:
        "Sementara",

      className:
        "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]",
    },

    MISSING_COST: {
      label:
        "Biaya belum lengkap",

      className:
        "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]",
    },

    NO_REVENUE: {
      label:
        "Tanpa penjualan",

      className:
        "border-border bg-[#F9FAFB] text-muted",
    },
  } satisfies Record<
    ProfitStatus,
    {
      label: string;
      className: string;
    }
  >;

  const meta =
    map[
      status
    ];

  return (
    <span
      className={[
        "inline-flex rounded-full border px-2 py-1 text-[11px] font-medium",
        meta.className,
      ].join(
        " ",
      )}
    >
      {meta.label}
    </span>
  );
}

function KpiCard({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <Card
      className={[
        "min-w-0 p-4",
        emphasized
          ? "border-primary/30"
          : "",
      ].join(
        " ",
      )}
    >
      <p className="text-xs font-medium text-muted">
        {label}
      </p>

      <p
        className={[
          "mt-1 break-words text-lg font-semibold sm:text-xl",
          emphasized
            ? "text-primary-hover"
            : "text-foreground",
        ].join(
          " ",
        )}
      >
        {value}
      </p>
    </Card>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-[10px] bg-[#F9FAFB] p-3">
      <p className="text-xs text-muted">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}

export function ReportSummary({
  data,
}: ReportSummaryProps) {
  const hasDataQualityIssue =
    data.dataQuality
      .incompleteReports >
      0 ||
    data.dataQuality
      .missingFeedCostReports >
      0 ||
    data.hpp.status !==
      "READY" ||
    data.profit.status !==
      "READY";

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Laporan
        </h1>

        <p className="mt-1 max-w-2xl text-sm text-muted">
          Review produksi, penjualan, biaya, HPP, profit operasional, dan posisi stok dalam satu periode.
        </p>
      </div>

      <Card className="p-4">
        <form
          method="get"
          className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="min-w-0 flex-1 sm:max-w-[190px]">
            <label
              htmlFor="reports-from"
              className="mb-1.5 block text-xs font-medium text-muted"
            >
              Dari
            </label>

            <input
              id="reports-from"
              name="from"
              type="date"
              defaultValue={
                data.period.from
              }
              className="h-11 w-full min-w-0 rounded-[10px] border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div className="min-w-0 flex-1 sm:max-w-[190px]">
            <label
              htmlFor="reports-to"
              className="mb-1.5 block text-xs font-medium text-muted"
            >
              Sampai
            </label>

            <input
              id="reports-to"
              name="to"
              type="date"
              defaultValue={
                data.period.to
              }
              className="h-11 w-full min-w-0 rounded-[10px] border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <Button
            type="submit"
            className="min-h-11"
          >
            Terapkan
          </Button>
        </form>
      </Card>

      <section className="space-y-3">
        <div>
          <h2 className="font-semibold text-foreground">
            Ringkasan Utama
          </h2>

          <p className="mt-1 text-xs text-muted">
            {formatDate(
              data.period.from,
            )}{" "}
            –{" "}
            {formatDate(
              data.period.to,
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <KpiCard
            label="Produksi Telur Jual"
            value={
              formatKg(
                data.production
                  .saleableEggKg,
              )
            }
          />

          <KpiCard
            label="Omzet"
            value={
              formatMoney(
                data.sales.revenue,
              )
            }
          />

          <KpiCard
            label="HPP Operasional"
            value={
              data.hpp.hppPerKg
                ? `${formatMoney(
                    data.hpp.hppPerKg,
                  )}/kg`
                : "Belum lengkap"
            }
          />

          <KpiCard
            label="Estimasi Profit"
            value={
              data.profit
                .estimatedOperationalProfit ===
              null
                ? "Belum dapat dihitung"
                : formatMoney(
                    data.profit
                      .estimatedOperationalProfit,
                  )
            }
            emphasized
          />
        </div>
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-2">
        <Card className="min-w-0 p-4">
          <h2 className="font-semibold text-foreground">
            Produksi
          </h2>

          <p className="mt-1 text-xs text-muted">
            Hanya Daily Report COMPLETE.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Metric
              label="Telur Jual"
              value={
                formatKg(
                  data.production
                    .saleableEggKg,
                )
              }
            />

            <Metric
              label="Telur Rusak"
              value={
                formatKg(
                  data.production
                    .damagedEggKg,
                )
              }
            />

            <Metric
              label="Persentase Rusak"
              value={
                formatPercent(
                  data.production
                    .damageRatePercent,
                )
              }
            />

            <Metric
              label="Mortalitas"
              value={`${integerFormatter.format(
                data.production
                  .mortalityCount,
              )} ekor`}
            />
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-foreground">
                Total Pakan Digunakan
              </p>

              <p className="text-sm font-semibold text-foreground">
                {formatKg(
                  data.production
                    .feedUsedKg,
                )}
              </p>
            </div>

            {data.production
              .feedIngredients
              .length >
            0 ? (
              <div className="mt-3 divide-y divide-border rounded-[10px] border border-border">
                {data.production.feedIngredients.map(
                  (
                    ingredient,
                  ) => (
                    <div
                      key={
                        ingredient.ingredientId
                      }
                      className="flex min-w-0 items-center justify-between gap-4 px-3 py-2.5"
                    >
                      <span className="min-w-0 truncate text-sm text-muted">
                        {
                          ingredient.ingredientName
                        }
                      </span>

                      <span className="shrink-0 text-sm font-medium text-foreground">
                        {formatKg(
                          ingredient.usageKg,
                        )}
                      </span>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">
                Belum ada pemakaian pakan dari laporan lengkap.
              </p>
            )}
          </div>
        </Card>

        <Card className="min-w-0 p-4">
          <h2 className="font-semibold text-foreground">
            Penjualan
          </h2>

          <p className="mt-1 text-xs text-muted">
            Berdasarkan immutable Order snapshot.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Metric
              label="Omzet"
              value={
                formatMoney(
                  data.sales.revenue,
                )
              }
            />

            <Metric
              label="Terjual"
              value={
                formatKg(
                  data.sales.soldKg,
                )
              }
            />

            <Metric
              label="Jumlah Order"
              value={integerFormatter.format(
                data.sales.orderCount,
              )}
            />

            <Metric
              label="Rata-rata Harga Jual"
              value={
                data.sales
                  .averageSellingPricePerKg
                  ? `${formatMoney(
                      data.sales
                        .averageSellingPricePerKg,
                    )}/kg`
                  : "—"
              }
            />
          </div>
        </Card>

        <Card className="min-w-0 p-4">
          <h2 className="font-semibold text-foreground">
            Biaya
          </h2>

          <p className="mt-1 text-xs text-muted">
            Derived dari HPP engine periode.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Metric
              label="Biaya Pakan"
              value={
                formatMoney(
                  data.cost.feedCost,
                )
              }
            />

            <Metric
              label="Alokasi Biaya Rutin"
              value={
                formatMoney(
                  data.cost.routineCost,
                )
              }
            />

            <Metric
              label="Pengeluaran Harian"
              value={
                formatMoney(
                  data.cost
                    .dailyExpenseCost,
                )
              }
            />

            <Metric
              label="Total Biaya Operasional"
              value={
                formatMoney(
                  data.cost
                    .totalOperationalCost,
                )
              }
            />
          </div>
        </Card>

        <Card className="min-w-0 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold text-foreground">
                HPP & Profit
              </h2>

              <p className="mt-1 text-xs text-muted">
                Estimasi operasional periode.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <HppStatusBadge
                status={
                  data.hpp.status
                }
              />

              <ProfitStatusBadge
                status={
                  data.profit.status
                }
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Metric
              label="HPP Operasional / kg"
              value={
                data.hpp.hppPerKg
                  ? `${formatMoney(
                      data.hpp.hppPerKg,
                    )}/kg`
                  : "Belum lengkap"
              }
            />

            <Metric
              label="Estimasi Profit Operasional"
              value={
                data.profit
                  .estimatedOperationalProfit ===
                null
                  ? "Belum dapat dihitung"
                  : formatMoney(
                      data.profit
                        .estimatedOperationalProfit,
                    )
              }
            />

            <div className="col-span-2">
              <Metric
                label="Margin Operasional"
                value={
                  formatPercent(
                    data.profit
                      .operationalMarginPercent,
                  )
                }
              />
            </div>
          </div>

          <p className="mt-4 border-t border-border pt-3 text-xs leading-5 text-muted">
            Profit merupakan estimasi operasional periode, bukan laba akuntansi berbasis inventory valuation/COGS per batch.
          </p>
        </Card>
      </section>

      <section>
        <Card className="min-w-0 p-4">
          <div>
            <h2 className="font-semibold text-foreground">
              Stok Akhir
            </h2>

            <p className="mt-1 text-xs text-muted">
              Stok per{" "}
              {formatDate(
                data.inventory
                  .asOfDate,
              )}
              . Nilai ini adalah posisi as-of, bukan penjumlahan stok harian.
            </p>
          </div>

          <div className="mt-4 grid min-w-0 gap-4 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
            <div
              className={[
                "rounded-[10px] border p-4",
                data.inventory
                  .eggStockNegative
                  ? "border-[#FECACA] bg-[#FEF2F2]"
                  : "border-border bg-[#F9FAFB]",
              ].join(
                " ",
              )}
            >
              <p className="text-xs text-muted">
                Stok Telur Akhir
              </p>

              <p
                className={[
                  "mt-1 text-xl font-semibold",
                  data.inventory
                    .eggStockNegative
                    ? "text-danger"
                    : "text-foreground",
                ].join(
                  " ",
                )}
              >
                {formatKg(
                  data.inventory
                    .eggStockKg,
                )}
              </p>
            </div>

            <div className="min-w-0">
              <p className="mb-2 text-xs font-medium text-muted">
                Stok Bahan Pakan
              </p>

              {data.inventory
                .feedStocks.length >
              0 ? (
                <div className="divide-y divide-border overflow-hidden rounded-[10px] border border-border">
                  {data.inventory.feedStocks.map(
                    (
                      ingredient,
                    ) => (
                      <div
                        key={
                          ingredient.ingredientId
                        }
                        className="flex min-w-0 items-center justify-between gap-4 px-3 py-2.5"
                      >
                        <span className="min-w-0 truncate text-sm text-foreground">
                          {
                            ingredient.ingredientName
                          }
                        </span>

                        <span
                          className={[
                            "shrink-0 text-sm font-semibold",
                            ingredient.isNegative
                              ? "text-danger"
                              : "text-foreground",
                          ].join(
                            " ",
                          )}
                        >
                          {formatKg(
                            ingredient.stockKg,
                          )}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted">
                  Belum ada bahan pakan.
                </p>
              )}
            </div>
          </div>
        </Card>
      </section>

      <section>
        <Card className="min-w-0 p-4">
          <div className="flex items-start gap-3">
            {hasDataQualityIssue ? (
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#B45309]" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary-hover" />
            )}

            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-foreground">
                Data Quality
              </h2>

              <p className="mt-1 text-sm text-muted">
                {hasDataQualityIssue
                  ? "Ada data yang perlu diperiksa sebelum menggunakan hasil sebagai angka final."
                  : "Source utama periode ini lengkap."}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric
              label="Complete Reports"
              value={integerFormatter.format(
                data.dataQuality
                  .completeReports,
              )}
            />

            <Metric
              label="Incomplete Reports"
              value={integerFormatter.format(
                data.dataQuality
                  .incompleteReports,
              )}
            />

            <Metric
              label="Missing Feed Cost"
              value={integerFormatter.format(
                data.dataQuality
                  .missingFeedCostReports,
              )}
            />

            <div className="rounded-[10px] bg-[#F9FAFB] p-3">
              <p className="text-xs text-muted">
                HPP / Profit
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                <HppStatusBadge
                  status={
                    data.dataQuality
                      .hppStatus
                  }
                />

                <ProfitStatusBadge
                  status={
                    data.dataQuality
                      .profitStatus
                  }
                />
              </div>
            </div>
          </div>

          {data.dataQuality
            .warnings.length >
          0 ? (
            <div className="mt-4 border-t border-border pt-3">
              <ul className="space-y-1.5 pl-5 text-xs leading-5 text-muted">
                {data.dataQuality.warnings.map(
                  (
                    warning,
                  ) => (
                    <li
                      key={
                        warning
                      }
                      className="list-disc"
                    >
                      {warning}
                    </li>
                  ),
                )}
              </ul>
            </div>
          ) : null}
        </Card>
      </section>
    </div>
  );
}