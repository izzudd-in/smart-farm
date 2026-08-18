"use client";

import {
  useState,
} from "react";

import {
  CalendarDays,
  Pencil,
  Plus,
  Receipt,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
} from "@/components/ui/card";

import {
  RoutineCostDialog,
} from "@/features/expenses/components/routine-cost-dialog";

import type {
  RoutineCostsData,
  RoutineCostView,
} from "@/features/expenses/types/routine-cost";

type RoutineCostsProps = {
  data: RoutineCostsData;
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

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Card className="min-w-0 p-4">
      <p className="text-xs font-medium text-muted">
        {label}
      </p>

      <p className="mt-1 truncate text-lg font-semibold text-foreground sm:text-xl">
        {value}
      </p>
    </Card>
  );
}

export function RoutineCosts({
  data,
}: RoutineCostsProps) {
  const [
    dialogCost,
    setDialogCost,
  ] = useState<
    | RoutineCostView
    | null
    | undefined
  >(
    undefined,
  );

  return (
    <>
      <div className="min-w-0 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Biaya Rutin
            </h2>

            <p className="mt-1 text-sm text-muted">
              Biaya periodik yang periodenya bersinggungan dengan periode aktif.
            </p>
          </div>

          <Button
            className="min-h-11"
            onClick={() =>
              setDialogCost(
                null,
              )
            }
          >
            <Plus className="h-4 w-4" />
            Tambah Biaya
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <SummaryCard
            label="Biaya Rutin"
            value={
              formatMoney(
                data.summary.originalAmount,
              )
            }
          />

          <SummaryCard
            label="Alokasi Dalam Periode"
            value={
              formatMoney(
                data.summary.allocatedAmount,
              )
            }
          />

          <div className="col-span-2 lg:col-span-1">
            <SummaryCard
              label="Jumlah Komponen"
              value={
                data.summary.componentCount.toLocaleString(
                  "id-ID",
                )
              }
            />
          </div>
        </div>

        {data.costs.length ===
        0 ? (
          <Card className="p-8 text-center">
            <Receipt className="mx-auto h-7 w-7 text-muted-light" />

            <p className="mt-3 font-medium text-foreground">
              Belum ada biaya rutin pada periode ini.
            </p>

            <p className="mt-1 text-sm text-muted">
              Tambahkan biaya periodik atau ubah periode monitoring.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {data.costs.map(
              (
                cost,
              ) => (
                <Card
                  key={
                    cost.id
                  }
                  className="min-w-0 p-4"
                >
                  <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground">
                          {
                            cost.name
                          }
                        </h3>

                        <span className="rounded-full bg-[#F3F4F6] px-2 py-1 text-[11px] font-medium text-muted">
                          {
                            cost.categoryLabel
                          }
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />

                        <span>
                          {formatDate(
                            cost.periodStart,
                          )}{" "}
                          –{" "}
                          {formatDate(
                            cost.periodEnd,
                          )}
                        </span>
                      </div>

                      {cost.note ? (
                        <p className="mt-2 line-clamp-2 text-sm text-muted">
                          {
                            cost.note
                          }
                        </p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 items-start justify-between gap-4 sm:flex-col sm:items-end">
                      <div className="sm:text-right">
                        <p className="text-lg font-semibold text-foreground">
                          {formatMoney(
                            cost.amount,
                          )}
                        </p>

                        <p className="mt-1 text-xs text-muted">
                          {formatMoney(
                            cost.dailyAllocation,
                          )}
                          /hari
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setDialogCost(
                            cost,
                          )
                        }
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </Card>
              ),
            )}
          </div>
        )}
      </div>

      {dialogCost !==
      undefined ? (
        <RoutineCostDialog
          key={
            dialogCost?.id ??
            "new-routine-cost"
          }
          cost={
            dialogCost
          }
          defaultPeriodStart={
            data.filters.from
          }
          defaultPeriodEnd={
            data.filters.to
          }
          onClose={() =>
            setDialogCost(
              undefined,
            )
          }
        />
      ) : null}
    </>
  );
}