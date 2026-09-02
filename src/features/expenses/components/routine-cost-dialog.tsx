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
  Calendar,
  Calculator,
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
  createRoutineCost,
  deleteRoutineCost,
  updateRoutineCost,
} from "@/features/expenses/actions/routine-cost";
import {
  ROUTINE_COST_CATEGORY_LABELS,
  ROUTINE_COST_CATEGORY_VALUES,
  type RoutineCostCategoryValue,
  type RoutineCostView,
} from "@/features/expenses/types/routine-cost";

type RoutineCostDialogProps = {
  cost: RoutineCostView | null;
  defaultPeriodStart: string;
  defaultPeriodEnd: string;
  onClose: () => void;
  onSuccess?: (message: string) => void;
};

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 2,
});

function getMonthRange(
  year: number,
  month: number,
): { start: string; end: string } {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(
    Date.UTC(year, month, 0),
  ).getUTCDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export function RoutineCostDialog({
  cost,
  defaultPeriodStart,
  defaultPeriodEnd,
  onClose,
  onSuccess,
}: RoutineCostDialogProps) {
  const router = useRouter();

  const [name, setName] = useState(cost?.name ?? "");
  const [category, setCategory] = useState<RoutineCostCategoryValue>(
    cost?.category ?? "SALARY",
  );
  const [amount, setAmount] = useState(cost?.amount ?? "");
  const [periodStart, setPeriodStart] = useState(
    cost?.periodStart ?? defaultPeriodStart,
  );
  const [periodEnd, setPeriodEnd] = useState(
    cost?.periodEnd ?? defaultPeriodEnd,
  );
  const [note, setNote] = useState(cost?.note ?? "");
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [isPending, startTransition] = useTransition();

  const isEdit = Boolean(cost);

  // Quick Monthly Range presets
  const todayStr = getJakartaTodayString();
  const [currentYear, currentMonth] = todayStr
    .split("-")
    .map(Number);

  const thisMonthRange = useMemo(
    () => getMonthRange(currentYear, currentMonth),
    [currentYear, currentMonth],
  );

  const nextMonthRange = useMemo(() => {
    const nextDate = new Date(
      Date.UTC(currentYear, currentMonth, 1),
    );
    return getMonthRange(
      nextDate.getUTCFullYear(),
      nextDate.getUTCMonth() + 1,
    );
  }, [currentYear, currentMonth]);

  const prevMonthRange = useMemo(() => {
    const prevDate = new Date(
      Date.UTC(currentYear, currentMonth - 2, 1),
    );
    return getMonthRange(
      prevDate.getUTCFullYear(),
      prevDate.getUTCMonth() + 1,
    );
  }, [currentYear, currentMonth]);

  // Live calculation of days and daily allocation
  const calculationPreview = useMemo(() => {
    const cleanedAmount = amount.trim().replace(",", ".");
    const numAmount = Number(cleanedAmount);
    const validAmount =
      Number.isFinite(numAmount) && numAmount > 0 ? numAmount : null;

    if (!periodStart || !periodEnd) {
      return {
        isValid: false,
        days: 0,
        amountFormatted: validAmount ? currencyFormatter.format(validAmount) : null,
        dailyAllocationFormatted: null,
      };
    }

    try {
      const start = parseDateOnly(periodStart);
      const end = parseDateOnly(periodEnd);

      if (start > end) {
        return {
          isValid: false,
          days: 0,
          amountFormatted: validAmount ? currencyFormatter.format(validAmount) : null,
          dailyAllocationFormatted: null,
        };
      }

      const days =
        Math.floor(
          (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
        ) + 1;

      const dailyAllocation =
        validAmount !== null && days > 0 ? validAmount / days : null;

      return {
        isValid: true,
        days,
        amountFormatted: validAmount ? currencyFormatter.format(validAmount) : null,
        dailyAllocationFormatted:
          dailyAllocation !== null
            ? currencyFormatter.format(dailyAllocation)
            : null,
      };
    } catch {
      return {
        isValid: false,
        days: 0,
        amountFormatted: null,
        dailyAllocationFormatted: null,
      };
    }
  }, [amount, periodStart, periodEnd]);

  function handleSetMonthPreset(preset: { start: string; end: string }) {
    setPeriodStart(preset.start);
    setPeriodEnd(preset.end);
    if (error) setError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Nama biaya rutin wajib diisi.");
      return;
    }

    if (!amount.trim()) {
      setError("Nominal biaya wajib diisi.");
      return;
    }

    const numAmount = Number(amount.trim().replace(",", "."));
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      setError("Nominal harus berupa angka lebih dari 0.");
      return;
    }

    if (!periodStart || !periodEnd) {
      setError("Tanggal mulai dan tanggal selesai wajib diisi.");
      return;
    }

    if (periodStart > periodEnd) {
      setError("Tanggal mulai tidak boleh setelah tanggal selesai.");
      return;
    }

    startTransition(async () => {
      const input = {
        name: trimmedName,
        category,
        amount,
        periodStart,
        periodEnd,
        note: note.trim(),
      };

      const result = cost
        ? await updateRoutineCost(cost.id, input)
        : await createRoutineCost(input);

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
    if (!cost) return;
    setError("");

    startTransition(async () => {
      const result = await deleteRoutineCost(cost.id);
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
        aria-labelledby="routine-cost-dialog-title"
        className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:max-w-lg sm:rounded-[14px]"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-white px-5 py-4">
          <div>
            <h2
              id="routine-cost-dialog-title"
              className="text-base font-semibold text-foreground sm:text-lg"
            >
              {isEdit ? "Edit Biaya Rutin" : "Tambah Biaya Rutin"}
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Pencatatan biaya rutin bulanan/periodik untuk kalkulasi HPP dan keuangan.
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

          {/* Quick Month Presets */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">
              Pilihan Cepat Periode
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleSetMonthPreset(thisMonthRange)}
                className={[
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  periodStart === thisMonthRange.start &&
                  periodEnd === thisMonthRange.end
                    ? "border-primary bg-primary-soft text-primary font-semibold"
                    : "border-border bg-white text-muted hover:bg-[#F9FAFB] hover:text-foreground",
                ].join(" ")}
              >
                Bulan Ini
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleSetMonthPreset(nextMonthRange)}
                className={[
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  periodStart === nextMonthRange.start &&
                  periodEnd === nextMonthRange.end
                    ? "border-primary bg-primary-soft text-primary font-semibold"
                    : "border-border bg-white text-muted hover:bg-[#F9FAFB] hover:text-foreground",
                ].join(" ")}
              >
                Bulan Depan
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleSetMonthPreset(prevMonthRange)}
                className={[
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  periodStart === prevMonthRange.start &&
                  periodEnd === prevMonthRange.end
                    ? "border-primary bg-primary-soft text-primary font-semibold"
                    : "border-border bg-white text-muted hover:bg-[#F9FAFB] hover:text-foreground",
                ].join(" ")}
              >
                Bulan Lalu
              </button>
            </div>
          </div>

          <Input
            label="Nama Biaya Rutin"
            placeholder="Contoh: Gaji Karyawan September"
            maxLength={120}
            value={name}
            disabled={isPending}
            autoFocus
            onChange={(event) => {
              setName(event.target.value);
              if (error) setError("");
            }}
          />

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="routine-cost-category"
              className="text-[13px] font-medium text-foreground"
            >
              Kategori Biaya
            </label>

            <select
              id="routine-cost-category"
              value={category}
              disabled={isPending}
              onChange={(event) => {
                setCategory(
                  event.target.value as RoutineCostCategoryValue,
                );
                if (error) setError("");
              }}
              className="h-11 w-full rounded-[10px] border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-[#F3F4F6]"
            >
              {ROUTINE_COST_CATEGORY_VALUES.map((value) => (
                <option key={value} value={value}>
                  {ROUTINE_COST_CATEGORY_LABELS[value]}
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
              label="Nominal Total (Rp)"
              placeholder="Contoh: 9300000"
              value={amount}
              disabled={isPending}
              onChange={(event) => {
                setAmount(event.target.value);
                if (error) setError("");
              }}
            />

            {calculationPreview.amountFormatted ? (
              <p className="mt-1 text-xs text-muted">
                Nominal:{" "}
                <span className="font-semibold text-foreground">
                  {calculationPreview.amountFormatted}
                </span>
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              type="date"
              label="Tanggal Mulai"
              value={periodStart}
              max={periodEnd || undefined}
              disabled={isPending}
              onChange={(event) => {
                setPeriodStart(event.target.value);
                if (error) setError("");
              }}
            />

            <Input
              type="date"
              label="Tanggal Selesai"
              value={periodEnd}
              min={periodStart || undefined}
              disabled={isPending}
              onChange={(event) => {
                setPeriodEnd(event.target.value);
                if (error) setError("");
              }}
            />
          </div>

          {/* Real-time Calculation Summary Card */}
          <div className="rounded-[10px] border border-border/80 bg-[#F9FAFB] p-3.5 text-xs text-foreground space-y-2">
            <div className="flex items-center gap-1.5 font-medium text-muted">
              <Calculator className="h-4 w-4 text-primary" />
              <span>Estimasi Alokasi HPP</span>
            </div>

            {calculationPreview.isValid && calculationPreview.days > 0 ? (
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50 text-xs">
                <div>
                  <span className="text-muted">Durasi Periode:</span>
                  <p className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                    <Calendar className="h-3.5 w-3.5 text-muted" />
                    {calculationPreview.days} Hari
                  </p>
                </div>
                <div>
                  <span className="text-muted">Alokasi Harian:</span>
                  <p className="font-semibold text-primary mt-0.5">
                    {calculationPreview.dailyAllocationFormatted ?? "Rp 0"} / hari
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-muted italic">
                Masukkan nominal dan rentang tanggal untuk melihat alokasi harian.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="routine-cost-note"
              className="text-[13px] font-medium text-foreground"
            >
              Catatan (Opsional)
            </label>

            <textarea
              id="routine-cost-note"
              rows={2}
              maxLength={1000}
              placeholder="Tambahkan keterangan rincian biaya jika ada..."
              value={note}
              disabled={isPending}
              onChange={(event) => {
                setNote(event.target.value);
                if (error) setError("");
              }}
              className="w-full resize-y rounded-[10px] border border-border bg-white px-3 py-2 text-sm text-foreground outline-none transition-all placeholder:text-muted-light focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-[#F3F4F6]"
            />
          </div>

          {/* Delete confirmation section */}
          {showDeleteConfirm ? (
            <div className="rounded-[10px] border border-danger/30 bg-danger-soft p-3 text-xs space-y-2.5">
              <p className="font-medium text-danger">
                Apakah Anda yakin ingin menghapus biaya rutin &quot;{cost?.name}&quot;?
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
                    : "Tambah Biaya"}
              </Button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}