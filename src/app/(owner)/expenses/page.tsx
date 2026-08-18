import Link from "next/link";

import {
  AlertTriangle,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
} from "@/components/ui/card";

import {
  getJakartaTodayString,
  parseDateOnly,
} from "@/features/daily-operations/utils/date";

import {
  DailyExpenses,
} from "@/features/expenses/components/daily-expenses";

import {
  RoutineCosts,
} from "@/features/expenses/components/routine-costs";

import {
  getCostMonitoringForPeriod,
  type CostMonitoringForPeriod,
} from "@/features/expenses/queries/get-cost-monitoring";

import {
  getDailyExpenses,
} from "@/features/expenses/queries/get-daily-expenses";

import {
  getRoutineCosts,
} from "@/features/expenses/queries/get-routine-costs";

import {
  parseRoutineCostFilters,
} from "@/features/expenses/schemas/routine-cost";

type ExpenseTab =
  | "routine"
  | "daily";

type ExpensesPageProps = {
  searchParams: Promise<{
    tab?:
      | string
      | string[];

    from?:
      | string
      | string[];

    to?:
      | string
      | string[];

    category?:
      | string
      | string[];

    source?:
      | string
      | string[];
  }>;
};

function firstValue(
  value:
    | string
    | string[]
    | undefined,
): string | undefined {
  return Array.isArray(
    value,
  )
    ? value[0]
    : value;
}

function tabUrl(
  tab: ExpenseTab,
  from: string,
  to: string,
): string {
  const params =
    new URLSearchParams({
      tab,
      from,
      to,
    });

  return `/expenses?${params.toString()}`;
}

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

function formatMoney(
  value: string,
): string {
  const number =
    Number(
      value,
    );

  return currencyFormatter.format(
    Number.isFinite(
      number,
    )
      ? number
      : 0,
  );
}

function OverviewCard({
  label,
  value,
  detail,
  emphasis = false,
}: {
  label: string;
  value: string;
  detail?: string;
  emphasis?: boolean;
}) {
  return (
    <Card
      className={[
        "min-w-0 p-4",
        emphasis
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
          "mt-1 truncate text-lg font-semibold sm:text-xl",
          emphasis
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

function CostOverview({
  monitoring,
}: {
  monitoring: CostMonitoringForPeriod;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <OverviewCard
          label="Alokasi Biaya Rutin"
          value={
            formatMoney(
              monitoring.routineAllocation,
            )
          }
        />

        <OverviewCard
          label="Pengeluaran Harian"
          value={
            formatMoney(
              monitoring.dailyExpenseTotal,
            )
          }
          detail={`Owner ${formatMoney(
            monitoring.ownerDailyExpense,
          )} · Operasional ${formatMoney(
            monitoring.operationDailyExpense,
          )}`}
        />

        <OverviewCard
          label="Dari Operasional"
          value={
            formatMoney(
              monitoring.operationDailyExpense,
            )
          }
        />

        <OverviewCard
          label="Total Biaya Non-Pakan"
          value={
            formatMoney(
              monitoring.totalNonFeedCost,
            )
          }
          emphasis
        />
      </div>

      {monitoring.uncategorizedOperationCount >
      0 ? (
        <div className="flex items-start gap-2 rounded-[10px] border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2.5 text-xs text-[#92400E]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

          <span>
            Ada{" "}
            {
              monitoring.uncategorizedOperationCount
            }{" "}
            pengeluaran operasional yang belum memiliki kategori. Nilainya tetap dihitung dalam monitoring biaya.
          </span>
        </div>
      ) : null}
    </div>
  );
}

export default async function ExpensesPage({
  searchParams,
}: ExpensesPageProps) {
  const params =
    await searchParams;

  const tab: ExpenseTab =
    firstValue(
      params.tab,
    ) === "daily"
      ? "daily"
      : "routine";

  const category =
    firstValue(
      params.category,
    );

  const source =
    firstValue(
      params.source,
    );

  const dateFilters =
    parseRoutineCostFilters({
      from:
        firstValue(
          params.from,
        ),

      to:
        firstValue(
          params.to,
        ),
    });

  const from =
    parseDateOnly(
      dateFilters.from,
    );

  const to =
    parseDateOnly(
      dateFilters.to,
    );

  const monitoringPromise =
    getCostMonitoringForPeriod(
      from,
      to,
    );

  const content =
    tab ===
    "daily"
      ? await (async () => {
          const [
            monitoring,
            data,
          ] = await Promise.all([
            monitoringPromise,

            getDailyExpenses({
              ...dateFilters,
              category,
              source,
            }),
          ]);

          const today =
            getJakartaTodayString();

          const defaultExpenseDate =
            today <
            dateFilters.from
              ? dateFilters.from
              : today >
                  dateFilters.to
                ? dateFilters.to
                : today;

          return {
            monitoring,

            node: (
              <DailyExpenses
                data={
                  data
                }
                defaultExpenseDate={
                  defaultExpenseDate
                }
              />
            ),
          };
        })()
      : await (async () => {
          const [
            monitoring,
            data,
          ] = await Promise.all([
            monitoringPromise,

            getRoutineCosts(
              dateFilters,
            ),
          ]);

          return {
            monitoring,

            node: (
              <RoutineCosts
                data={
                  data
                }
              />
            ),
          };
        })();

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Biaya
        </h1>

        <p className="mt-1 max-w-2xl text-sm text-muted">
          Monitor biaya rutin dan pengeluaran harian tanpa input biaya operasional kedua.
        </p>
      </div>

      <Card className="p-4">
        <form
          method="get"
          className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end"
        >
          <input
            type="hidden"
            name="tab"
            value={
              tab
            }
          />

          {tab ===
            "daily" &&
          category ? (
            <input
              type="hidden"
              name="category"
              value={
                category
              }
            />
          ) : null}

          {tab ===
            "daily" &&
          source ? (
            <input
              type="hidden"
              name="source"
              value={
                source
              }
            />
          ) : null}

          <div className="min-w-0 flex-1 sm:max-w-[190px]">
            <label
              htmlFor="expense-period-from"
              className="mb-1.5 block text-xs font-medium text-muted"
            >
              Dari
            </label>

            <input
              id="expense-period-from"
              name="from"
              type="date"
              defaultValue={
                dateFilters.from
              }
              className="h-11 w-full min-w-0 rounded-[10px] border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div className="min-w-0 flex-1 sm:max-w-[190px]">
            <label
              htmlFor="expense-period-to"
              className="mb-1.5 block text-xs font-medium text-muted"
            >
              Sampai
            </label>

            <input
              id="expense-period-to"
              name="to"
              type="date"
              defaultValue={
                dateFilters.to
              }
              className="h-11 w-full min-w-0 rounded-[10px] border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div className="flex min-w-0 gap-2">
            <Button
              type="submit"
              className="min-h-11"
            >
              Terapkan
            </Button>

            <Link
              href={`/expenses?tab=${tab}`}
              className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-border bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-[#F9FAFB]"
            >
              Reset Periode
            </Link>
          </div>
        </form>
      </Card>

      <CostOverview
        monitoring={
          content.monitoring
        }
      />

      <div className="flex min-w-0 overflow-x-auto border-b border-border">
        <Link
          href={tabUrl(
            "routine",
            dateFilters.from,
            dateFilters.to,
          )}
          aria-current={
            tab ===
            "routine"
              ? "page"
              : undefined
          }
          className={[
            "shrink-0 border-b-2 px-4 py-3 text-sm font-medium",
            tab ===
            "routine"
              ? "border-primary text-primary-hover"
              : "border-transparent text-muted hover:text-foreground",
          ].join(
            " ",
          )}
        >
          Biaya Rutin
        </Link>

        <Link
          href={tabUrl(
            "daily",
            dateFilters.from,
            dateFilters.to,
          )}
          aria-current={
            tab ===
            "daily"
              ? "page"
              : undefined
          }
          className={[
            "shrink-0 border-b-2 px-4 py-3 text-sm font-medium",
            tab ===
            "daily"
              ? "border-primary text-primary-hover"
              : "border-transparent text-muted hover:text-foreground",
          ].join(
            " ",
          )}
        >
          Pengeluaran Harian
        </Link>
      </div>

      {content.node}
    </div>
  );
}