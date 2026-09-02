"use client";

import {
  type FormEvent,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getJakartaTodayString,
  parseDateOnly,
} from "@/features/daily-operations/utils/date";
import {
  createDailyExpense,
  deleteDailyExpense,
  updateDailyExpense,
} from "@/features/expenses/actions/daily-expense";
import {
  DAILY_EXPENSE_CATEGORY_LABELS,
  DAILY_EXPENSE_CATEGORY_VALUES,
  type DailyExpenseCategoryValue,
  type DailyExpenseView,
} from "@/features/expenses/types/daily-expense";

type DailyExpenseDialogProps = {
  expense: DailyExpenseView | null;
  defaultDate: string;
  onClose: () => void;
  onSuccess?: (message: string) => void;
};

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 2,
});

export function DailyExpenseDialog({
  expense,
  defaultDate,
  onClose,
  onSuccess,
}: DailyExpenseDialogProps) {
  const router = useRouter();

  const [occurredAt, setOccurredAt] = useState(
    expense?.occurredAt ?? defaultDate,
  );
  const [category, setCategory] = useState<DailyExpenseCategoryValue>(
    expense?.category ?? "OTHER",
  );
  const [amount, setAmount] = useState(expense?.amount ?? "");
  const [description, setDescription] = useState(
    expense?.description ?? "",
  );
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [isPending, startTransition] = useTransition();

  const isEdit = Boolean(expense?.ownerExpenseId);

  // Quick Date Presets
  const todayStr = getJakartaTodayString();
  const yesterdayStr = useMemo(() => {
    const today = parseDateOnly(todayStr);
    const yesterday = new Date(
      today.getTime() - 24 * 60 * 60 * 1000,
    );
    return yesterday.toISOString().slice(0, 10);
  }, [todayStr]);

  const parsedAmountNumber = useMemo(() => {
    const cleaned = amount.trim().replace(",", ".");
    if (!cleaned) return null;
    const num = Number(cleaned);
    return Number.isFinite(num) && num > 0 ? num : null;
  }, [amount]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!occurredAt.trim()) {
      setError("Tanggal pengeluaran wajib diisi.");
      return;
    }

    if (!amount.trim()) {
      setError("Nominal pengeluaran wajib diisi.");
      return;
    }

    if (parsedAmountNumber === null) {
      setError("Nominal harus berupa angka lebih dari 0.");
      return;
    }

    const trimmedDescription = description.trim();
    if (!trimmedDescription) {
      setError("Keterangan pengeluaran wajib diisi.");
      return;
    }

    startTransition(async () => {
      const input = {
        occurredAt,
        category,
        amount,
        description: trimmedDescription,
      };

      const result = expense?.ownerExpenseId
        ? await updateDailyExpense(expense.ownerExpenseId, input)
        : await createDailyExpense(input);

      if (!result.success) {
        setError(result.error);
        return;
      }

      onSuccess?.(result.message);
      router.refresh();
      onClose();
    });
  }

  function handleDelete() {
    if (!expense?.ownerExpenseId) return;
    setError("");

    startTransition(async () => {
      const result = await deleteDailyExpense(expense.ownerExpenseId!);
      if (!result.success) {
        setError(result.error);
        setShowDeleteConfirm(false);
        return;
      }

      onSuccess?.(result.message);
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Tutup"
        className="absolute inset-0 cursor-default bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="daily-expense-dialog-title"
        className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:max-w-lg sm:rounded-[14px]"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-white px-5 py-4">
          <div>
            <h2
              id="daily-expense-dialog-title"
              className="text-base font-semibold text-foreground sm:text-lg"
            >
              {isEdit ? "Edit Pengeluaran Harian" : "Tambah Pengeluaran Harian"}
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Pencatatan pengeluaran operasional langsung oleh Tim Finance / Owner.
            </p>
          </div>

          <button
            type="button"
            aria-label="Tutup"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-[#F3F4F6] hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {error ? (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-[10px] border border-[#FECACA] bg-danger-soft p-3 text-xs text-danger sm:text-sm"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          {/* Quick Date Presets */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-medium text-foreground">
                Tanggal Pengeluaran
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    setOccurredAt(todayStr);
                    if (error) setError("");
                  }}
                  className={[
                    "rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors",
                    occurredAt === todayStr
                      ? "bg-primary-soft text-primary font-semibold"
                      : "bg-[#F3F4F6] text-muted hover:text-foreground",
                  ].join(" ")}
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    setOccurredAt(yesterdayStr);
                    if (error) setError("");
                  }}
                  className={[
                    "rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors",
                    occurredAt === yesterdayStr
                      ? "bg-primary-soft text-primary font-semibold"
                      : "bg-[#F3F4F6] text-muted hover:text-foreground",
                  ].join(" ")}
                >
                  Kemarin
                </button>
              </div>
            </div>

            <Input
              type="date"
              value={occurredAt}
              disabled={isPending}
              onChange={(event) => {
                setOccurredAt(event.target.value);
                if (error) setError("");
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="daily-expense-category"
              className="text-[13px] font-medium text-foreground"
            >
              Kategori Pengeluaran
            </label>

            <select
              id="daily-expense-category"
              value={category}
              disabled={isPending}
              onChange={(event) => {
                setCategory(
                  event.target.value as DailyExpenseCategoryValue,
                );
                if (error) setError("");
              }}
              className="h-11 w-full rounded-[10px] border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-[#F3F4F6]"
            >
              {DAILY_EXPENSE_CATEGORY_VALUES.map((value) => (
                <option key={value} value={value}>
                  {DAILY_EXPENSE_CATEGORY_LABELS[value]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Input
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              label="Nominal (Rp)"
              placeholder="Contoh: 150000"
              value={amount}
              disabled={isPending}
              onChange={(event) => {
                setAmount(event.target.value);
                if (error) setError("");
              }}
            />

            {parsedAmountNumber !== null ? (
              <p className="mt-1 text-xs text-muted">
                Nominal:{" "}
                <span className="font-semibold text-foreground">
                  {currencyFormatter.format(parsedAmountNumber)}
                </span>
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="daily-expense-description"
              className="text-[13px] font-medium text-foreground"
            >
              Keterangan / Rincian
            </label>

            <textarea
              id="daily-expense-description"
              rows={3}
              maxLength={1000}
              placeholder="Contoh: Pembelian obat dan vitamin ayam tambahan di toko ternak"
              value={description}
              disabled={isPending}
              onChange={(event) => {
                setDescription(event.target.value);
                if (error) setError("");
              }}
              className="w-full resize-y rounded-[10px] border border-border bg-white px-3 py-2 text-sm text-foreground outline-none transition-all placeholder:text-muted-light focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-[#F3F4F6]"
            />
          </div>

          {/* Delete confirmation section */}
          {showDeleteConfirm ? (
            <div className="rounded-[10px] border border-danger/30 bg-danger-soft p-3 text-xs space-y-2.5">
              <p className="font-medium text-danger">
                Apakah Anda yakin ingin menghapus pengeluaran harian ini?
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isPending}
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isPending}
                  className="bg-danger text-white hover:bg-danger-hover"
                  onClick={handleDelete}
                >
                  {isPending ? "Menghapus..." : "Ya, Hapus"}
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
            <div>
              {isEdit && !showDeleteConfirm ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isPending}
                  className="text-danger hover:bg-danger-soft hover:text-danger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Hapus
                </Button>
              ) : null}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={isPending}
                onClick={onClose}
              >
                Batal
              </Button>

              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Menyimpan..."
                  : isEdit
                    ? "Simpan Perubahan"
                    : "Tambah Pengeluaran"}
              </Button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}