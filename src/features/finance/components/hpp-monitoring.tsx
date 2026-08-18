import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Info,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
} from "@/components/ui/card";

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

function formatMoney(
  value:
    | string
    | null,
): string {
  if (
    value === null
  ) {
    return "Belum dapat dihitung";
  }

  const numeric =
    Number(
      value,
    );

  return currencyFormatter.format(
    Number.isFinite(
      numeric,
    )
      ? numeric
      : 0,
  );
}

function formatKg(
  value: string,
): string {
  const numeric =
    Number(
      value,
    );

  return `${quantityFormatter.format(
    Number.isFinite(
      numeric,
    )
      ? numeric
      : 0,
  )} kg`;
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

function getHppStatusMeta(
  status: HppStatus,
) {
  switch (
    status
  ) {
    case "READY":
      return {
        label:
          "Data lengkap",

        className:
          "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]",
      };

    case "PROVISIONAL":
      return {
        label:
          "Data sementara",

        className:
          "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]",
      };

    case "MISSING_FEED_COST":
      return {
        label:
          "Biaya pakan belum lengkap",

        className:
          "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]",
      };

    case "NO_PRODUCTION":
      return {
        label:
          "Belum ada produksi",

        className:
          "border-border bg-[#F9FAFB] text-muted",
      };
  }
}

function getProfitStatusMeta(
  status: ProfitStatus,
) {
  switch (
    status
  ) {
    case "READY":
      return {
        label:
          "Data lengkap",

        icon:
          CheckCircle2,

        className:
          "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]",
      };

    case "PROVISIONAL":
      return {
        label:
          "Estimasi sementara",

        icon:
          CircleDashed,

        className:
          "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]",
      };

    case "MISSING_COST":
      return {
        label:
          "Biaya belum lengkap",

        icon:
          AlertTriangle,

        className:
          "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]",
      };

    case "NO_REVENUE":
      return {
        label:
          "Belum ada penjualan",

        icon:
          Info,

        className:
          "border-border bg-[#F9FAFB] text-muted",
      };
  }
}

function DataQuality({
  data,
}: {
  data: ProfitPeriodResult;
}) {
  const profitMeta =
    getProfitStatusMeta(
      data.status,
    );

  const hppMeta =
    getHppStatusMeta(
      data.hpp.status,
    );

  const Icon =
    profitMeta.icon;

  return (
    <div
      className={[
        "rounded-[10px] border p-3",
        profitMeta.className,
      ].join(
        " ",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Icon className="h-4 w-4 shrink-0" />

        <p className="text-sm font-semibold">
          {
            profitMeta.label
          }
        </p>

        <span
          className={[
            "rounded-full border px-2 py-0.5 text-[10px] font-medium",
            hppMeta.className,
          ].join(
            " ",
          )}
        >
          HPP ·{" "}
          {
            hppMeta.label
          }
        </span>
      </div>

      {data.warnings.length >
      0 ? (
        <ul className="mt-2 space-y-1 pl-6 text-xs leading-5">
          {data.warnings.map(
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

      {detail ? (
        <p className="mt-1 break-words text-[11px] leading-4 text-muted">
          {detail}
        </p>
      ) : null}
    </Card>
  );
}

function DailyRow({
  day,
}: {
  day: DailyHppBreakdown;
}) {
  const status =
    getHppStatusMeta(
      day.status,
    );

  return (
    <Card className="min-w-0 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 lg:w-[180px]">
          <p className="font-semibold text-foreground">
            {formatDate(
              day.date,
            )}
          </p>

          <span
            className={[
              "mt-2 inline-flex rounded-full border px-2 py-1 text-[11px] font-medium",
              status.className,
            ].join(
              " ",
            )}
          >
            {
              status.label
            }
          </span>
        </div>

        <div className="grid min-w-0 flex-1 grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <div className="min-w-0">
            <p className="text-[11px] text-muted">
              Produksi
            </p>

            <p className="mt-1 break-words text-sm font-medium text-foreground">
              {formatKg(
                day.productionKg,
              )}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] text-muted">
              Pakan
            </p>

            <p className="mt-1 break-words text-sm font-medium text-foreground">
              {formatMoney(
                day.feedCost,
              )}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] text-muted">
              Rutin
            </p>

            <p className="mt-1 break-words text-sm font-medium text-foreground">
              {formatMoney(
                day.routineCost,
              )}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] text-muted">
              Expense
            </p>

            <p className="mt-1 break-words text-sm font-medium text-foreground">
              {formatMoney(
                day.dailyExpenseCost,
              )}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] text-muted">
              Total
            </p>

            <p className="mt-1 break-words text-sm font-medium text-foreground">
              {formatMoney(
                day.totalCost,
              )}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] text-muted">
              HPP / kg
            </p>

            <p className="mt-1 break-words text-sm font-semibold text-primary-hover">
              {day.hppPerKg
                ? formatMoney(
                    day.hppPerKg,
                  )
                : "—"}
            </p>
          </div>
        </div>
      </div>

      {day.warnings.length >
      0 ? (
        <p className="mt-3 border-t border-border pt-3 text-xs leading-5 text-muted">
          {day.warnings.join(
            " ",
          )}
        </p>
      ) : null}
    </Card>
  );
}

export function HppMonitoring({
  data,
}: HppMonitoringProps) {
  const {
    hpp,
  } = data;

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          HPP & Profit
        </h1>

        <p className="mt-1 max-w-2xl text-sm text-muted">
          Pantau biaya operasional, HPP telur, dan estimasi hasil operasional berdasarkan data farm aktual.
        </p>
      </div>

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
              defaultValue={
                data.from
              }
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
              defaultValue={
                data.to
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

      <DataQuality
        data={
          data
        }
      />

      <section className="space-y-3">
        <div>
          <h2 className="font-semibold text-foreground">
            HPP Operasional
          </h2>

          <p className="mt-1 text-xs text-muted">
            HPP farm-level berdasarkan produksi telur jual dan biaya operasional pada periode yang sama.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <KpiCard
            label="Produksi Telur Jual"
            value={
              formatKg(
                hpp.productionKg,
              )
            }
          />

          <KpiCard
            label="Biaya Pakan"
            value={
              formatMoney(
                hpp.feedCost,
              )
            }
          />

          <KpiCard
            label="Total Biaya Operasional"
            value={
              formatMoney(
                hpp.totalOperationalCost,
              )
            }
            detail={
              hpp.totalOperationalCost
                ? `Pakan ${formatMoney(
                    hpp.feedCost,
                  )} · Rutin ${formatMoney(
                    hpp.routineCost,
                  )} · Harian ${formatMoney(
                    hpp.dailyExpenseCost,
                  )}`
                : `Rutin ${formatMoney(
                    hpp.routineCost,
                  )} · Harian ${formatMoney(
                    hpp.dailyExpenseCost,
                  )}`
            }
          />

          <KpiCard
            label="HPP Operasional / kg"
            value={
              hpp.hppPerKg
                ? formatMoney(
                    hpp.hppPerKg,
                  )
                : "Belum dapat dihitung"
            }
            emphasized
          />
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-semibold text-foreground">
            Profit Operasional
          </h2>

          <p className="mt-1 text-xs text-muted">
            Estimasi hasil periode dari omzet dikurangi total biaya operasional periode.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <KpiCard
            label="Omzet"
            value={
              formatMoney(
                data.revenue,
              )
            }
            detail={`${data.orderCount.toLocaleString(
              "id-ID",
            )} order`}
          />

          <KpiCard
            label="Terjual"
            value={
              formatKg(
                data.soldKg,
              )
            }
          />

          <KpiCard
            label="Total Biaya Operasional"
            value={
              formatMoney(
                hpp.totalOperationalCost,
              )
            }
          />

          <KpiCard
            label="Estimasi Profit Operasional"
            value={
              data.estimatedOperationalProfit ===
              null
                ? "Belum dapat dihitung"
                : formatMoney(
                    data.estimatedOperationalProfit,
                  )
            }
            detail={
              data.operationalMarginPercent
                ? `Margin Operasional ${data.operationalMarginPercent.replace(
                    ".",
                    ",",
                  )}%`
                : "Margin Operasional —"
            }
            emphasized
          />
        </div>

        <Card className="p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted">
                Rata-rata Harga Jual
              </p>

              <p className="mt-1 font-semibold text-foreground">
                {data.averageSellingPricePerKg
                  ? `${formatMoney(
                      data.averageSellingPricePerKg,
                    )}/kg`
                  : "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted">
                HPP Operasional
              </p>

              <p className="mt-1 font-semibold text-foreground">
                {hpp.hppPerKg
                  ? `${formatMoney(
                      hpp.hppPerKg,
                    )}/kg`
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

        <div className="rounded-[10px] border border-border bg-[#F9FAFB] px-4 py-3 text-xs leading-5 text-muted">
          Estimasi profit operasional membandingkan penjualan dan biaya operasional pada periode yang sama. Nilai ini belum menggunakan inventory valuation/COGS akuntansi, sehingga perbedaan waktu antara produksi dan penjualan dapat memengaruhi hasil.
        </div>
      </section>

      <div className="rounded-[10px] border border-border bg-[#F9FAFB] px-4 py-3 text-xs leading-5 text-muted">
        HPP operasional dihitung dari biaya pakan, alokasi biaya rutin, dan pengeluaran harian yang tercatat di sistem. Nilai ini belum merupakan HPP akuntansi penuh dan belum memasukkan inventory valuation, depresiasi, pajak, bunga, maupun biaya lain yang belum dimodelkan.
      </div>

      <section>
        <div className="mb-3">
          <h2 className="font-semibold text-foreground">
            Breakdown HPP Harian
          </h2>

          <p className="mt-1 text-xs text-muted">
            Breakdown harian hanya untuk HPP. Estimasi Profit Operasional tetap dihitung pada level periode karena waktu produksi dan penjualan dapat berbeda.
          </p>
        </div>

        <div className="space-y-3">
          {hpp.daily.map(
            (
              day,
            ) => (
              <DailyRow
                key={
                  day.date
                }
                day={
                  day
                }
              />
            ),
          )}
        </div>
      </section>
    </div>
  );
}