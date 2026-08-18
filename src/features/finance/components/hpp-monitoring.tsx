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
  HppPeriodResult,
  HppStatus,
} from "@/features/finance/types/hpp";

type HppMonitoringProps = {
  data: HppPeriodResult;
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
    return currencyFormatter.format(
      0,
    );
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

function getStatusMeta(
  status: HppStatus,
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
          "Data sementara",

        icon:
          CircleDashed,

        className:
          "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]",
      };

    case "MISSING_FEED_COST":
      return {
        label:
          "Biaya pakan belum lengkap",

        icon:
          AlertTriangle,

        className:
          "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]",
      };

    case "NO_PRODUCTION":
      return {
        label:
          "Belum ada produksi",

        icon:
          Info,

        className:
          "border-border bg-[#F9FAFB] text-muted",
      };
  }
}

function StatusBox({
  status,
  warnings,
}: {
  status: HppStatus;
  warnings: string[];
}) {
  const meta =
    getStatusMeta(
      status,
    );

  const Icon =
    meta.icon;

  return (
    <div
      className={[
        "rounded-[10px] border p-3",
        meta.className,
      ].join(
        " ",
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0" />

        <p className="text-sm font-semibold">
          {
            meta.label
          }
        </p>
      </div>

      {warnings.length >
      0 ? (
        <ul className="mt-2 space-y-1 pl-6 text-xs leading-5">
          {warnings.map(
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
        <p className="mt-1 text-[11px] leading-4 text-muted">
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
    getStatusMeta(
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
          <div>
            <p className="text-[11px] text-muted">
              Produksi
            </p>

            <p className="mt-1 text-sm font-medium text-foreground">
              {formatKg(
                day.productionKg,
              )}
            </p>
          </div>

          <div>
            <p className="text-[11px] text-muted">
              Pakan
            </p>

            <p className="mt-1 text-sm font-medium text-foreground">
              {formatMoney(
                day.feedCost,
              )}
            </p>
          </div>

          <div>
            <p className="text-[11px] text-muted">
              Rutin
            </p>

            <p className="mt-1 text-sm font-medium text-foreground">
              {formatMoney(
                day.routineCost,
              )}
            </p>
          </div>

          <div>
            <p className="text-[11px] text-muted">
              Expense
            </p>

            <p className="mt-1 text-sm font-medium text-foreground">
              {formatMoney(
                day.dailyExpenseCost,
              )}
            </p>
          </div>

          <div>
            <p className="text-[11px] text-muted">
              Total
            </p>

            <p className="mt-1 text-sm font-medium text-foreground">
              {formatMoney(
                day.totalCost,
              )}
            </p>
          </div>

          <div>
            <p className="text-[11px] text-muted">
              HPP / kg
            </p>

            <p className="mt-1 text-sm font-semibold text-primary-hover">
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
  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          HPP & Profit
        </h1>

        <p className="mt-1 max-w-2xl text-sm text-muted">
          Pantau biaya operasional dan HPP telur berdasarkan data farm aktual.
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

      <StatusBox
        status={
          data.status
        }
        warnings={
          data.warnings
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard
          label="Produksi Telur Jual"
          value={
            formatKg(
              data.productionKg,
            )
          }
        />

        <KpiCard
          label="Biaya Pakan"
          value={
            formatMoney(
              data.feedCost,
            )
          }
        />

        <KpiCard
          label="Total Biaya Operasional"
          value={
            formatMoney(
              data.totalOperationalCost,
            )
          }
          detail={
            data.totalOperationalCost
              ? `Pakan ${formatMoney(
                  data.feedCost,
                )} · Rutin ${formatMoney(
                  data.routineCost,
                )} · Harian ${formatMoney(
                  data.dailyExpenseCost,
                )}`
              : `Rutin ${formatMoney(
                  data.routineCost,
                )} · Harian ${formatMoney(
                  data.dailyExpenseCost,
                )}`
          }
        />

        <KpiCard
          label="HPP Operasional / kg"
          value={
            data.hppPerKg
              ? formatMoney(
                  data.hppPerKg,
                )
              : "Belum dapat dihitung"
          }
          emphasized
        />
      </div>

      <div className="rounded-[10px] border border-border bg-[#F9FAFB] px-4 py-3 text-xs leading-5 text-muted">
        HPP operasional dihitung dari biaya pakan, alokasi biaya rutin, dan pengeluaran harian yang tercatat di sistem. Nilai ini belum merupakan HPP akuntansi penuh dan belum memasukkan depresiasi, pajak, bunga, maupun inventory valuation.
      </div>

      <div>
        <div className="mb-3">
          <h2 className="font-semibold text-foreground">
            Breakdown Harian
          </h2>

          <p className="mt-1 text-xs text-muted">
            Breakdown derived per tanggal. HPP periode di atas tetap dihitung dari total biaya periode ÷ total produksi periode, bukan rata-rata HPP harian.
          </p>
        </div>

        <div className="space-y-3">
          {data.daily.map(
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
      </div>
    </div>
  );
}