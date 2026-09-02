"use client";

import {
  useState,
} from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Pencil,
  Plus,
  Receipt,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DailyExpenseDialog } from "@/features/expenses/components/daily-expense-dialog";
import {
  DAILY_EXPENSE_CATEGORY_LABELS,
  DAILY_EXPENSE_CATEGORY_VALUES,
  type DailyExpenseView,
  type DailyExpensesData,
} from "@/features/expenses/types/daily-expense";

type DailyExpensesProps = {
  data: DailyExpensesData;
  defaultExpenseDate: string;
};

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 2,
});

function formatMoney(value: string): string {
  const number = Number(value);
  return currencyFormatter.format(
    Number.isFinite(number) ? number : 0,
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
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
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold text-foreground sm:text-xl">
        {value}
      </p>
    </Card>
  );
}

export function DailyExpenses({
  data,
  defaultExpenseDate,
}: DailyExpensesProps) {
  const [dialogExpense, setDialogExpense] = useState<
    DailyExpenseView | null | undefined
  >(undefined);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetHref = `/expenses?tab=daily&from=${encodeURIComponent(
    data.filters.from,
  )}&to=${encodeURIComponent(data.filters.to)}`;

  return (
    <>
      <div className="min-w-0 space-y-6">
        {/* Success Alert */}
        {successMessage ? (
          <div
            role="status"
            className="flex items-center justify-between gap-3 rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
            <button
              type="button"
              aria-label="Tutup notifikasi"
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-600 hover:text-emerald-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Pengeluaran Harian
            </h2>
            <p className="mt-1 text-sm text-muted">
              Gabungan input Owner dan pengeluaran insidental langsung dari Daily Operations.
            </p>
          </div>

          <Button
            className="min-h-11"
            onClick={() => {
              setSuccessMessage(null);
              setDialogExpense(null);
            }}
          >
            <Plus className="h-4 w-4" />
            Tambah Pengeluaran
          </Button>
        </div>

        <Card className="p-4">
          <form
            method="get"
            className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]"
          >
            <input type="hidden" name="tab" value="daily" />
            <input type="hidden" name="from" value={data.filters.from} />
            <input type="hidden" name="to" value={data.filters.to} />

            <div className="min-w-0">
              <label
                htmlFor="daily-expense-filter-category"
                className="mb-1.5 block text-xs font-medium text-muted"
              >
                Kategori
              </label>

              <select
                id="daily-expense-filter-category"
                name="category"
                defaultValue={data.filters.category}
                className="h-11 w-full min-w-0 rounded-[10px] border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              >
                <option value="ALL">Semua Kategori</option>
                {DAILY_EXPENSE_CATEGORY_VALUES.map((category) => (
                  <option key={category} value={category}>
                    {DAILY_EXPENSE_CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <label
                htmlFor="daily-expense-filter-source"
                className="mb-1.5 block text-xs font-medium text-muted"
              >
                Sumber Pengeluaran
              </label>

              <select
                id="daily-expense-filter-source"
                name="source"
                defaultValue={data.filters.source}
                className="h-11 w-full min-w-0 rounded-[10px] border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              >
                <option value="ALL">Semua Sumber</option>
                <option value="OWNER">Input Owner</option>
                <option value="OPERATION">Dari Daily Report</option>
              </select>
            </div>

            <div className="flex min-w-0 items-end gap-2">
              <Button type="submit" className="min-h-11">
                Terapkan
              </Button>

              <Link
                href={resetHref}
                className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-border bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-[#F9FAFB]"
              >
                Reset Filter
              </Link>
            </div>
          </form>
        </Card>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <SummaryCard
            label="Total Pengeluaran"
            value={formatMoney(data.summary.total)}
          />

          <SummaryCard
            label="Input Owner"
            value={formatMoney(data.summary.owner)}
          />

          <SummaryCard
            label="Dari Operasional"
            value={formatMoney(data.summary.operation)}
          />

          <SummaryCard
            label="Jumlah Transaksi"
            value={data.summary.count.toLocaleString("id-ID")}
          />
        </div>

        {data.expenses.length === 0 ? (
          <Card className="p-8 text-center">
            <Receipt className="mx-auto h-7 w-7 text-muted-light" />
            <p className="mt-3 font-medium text-foreground">
              Belum ada pengeluaran pada filter ini.
            </p>
            <p className="mt-1 text-sm text-muted">
              Ubah filter kategori/sumber atau catat pengeluaran harian baru.
            </p>
            <div className="mt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSuccessMessage(null);
                  setDialogExpense(null);
                }}
              >
                <Plus className="h-4 w-4" />
                Tambah Pengeluaran Sekarang
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {data.expenses.map((expense) => (
              <Card key={expense.id} className="min-w-0 p-4">
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">
                        {expense.categoryLabel}
                      </p>

                      <span
                        className={
                          expense.source === "OPERATION"
                            ? "rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-medium text-primary-hover"
                            : "rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-[11px] font-medium text-muted"
                        }
                      >
                        {expense.source === "OPERATION"
                          ? "Dari Daily Report"
                          : "Input Owner"}
                      </span>
                    </div>

                    <p className="mt-1 break-words text-xs text-muted">
                      {formatDate(expense.occurredAt)}
                      {expense.context ? ` · ${expense.context}` : ""}
                    </p>

                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                      {expense.description}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end">
                    <p className="text-lg font-semibold text-foreground">
                      {formatMoney(expense.amount)}
                    </p>

                    {expense.editable ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSuccessMessage(null);
                          setDialogExpense(expense);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {dialogExpense !== undefined ? (
        <DailyExpenseDialog
          key={dialogExpense?.id ?? "new-daily-expense"}
          expense={dialogExpense}
          defaultDate={defaultExpenseDate}
          onClose={() => setDialogExpense(undefined)}
          onSuccess={(message) => {
            setSuccessMessage(message);
          }}
        />
      ) : null}
    </>
  );
}