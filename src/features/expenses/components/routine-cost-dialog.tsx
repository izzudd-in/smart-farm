"use client";

import {
  type FormEvent,
  useState,
  useTransition,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  X,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

import {
  createRoutineCost,
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
};

export function RoutineCostDialog({
  cost,
  defaultPeriodStart,
  defaultPeriodEnd,
  onClose,
}: RoutineCostDialogProps) {
  const router =
    useRouter();

  const [
    name,
    setName,
  ] = useState(
    cost?.name ??
      "",
  );

  const [
    category,
    setCategory,
  ] = useState<RoutineCostCategoryValue>(
    cost?.category ??
      "SALARY",
  );

  const [
    amount,
    setAmount,
  ] = useState(
    cost?.amount ??
      "",
  );

  const [
    periodStart,
    setPeriodStart,
  ] = useState(
    cost?.periodStart ??
      defaultPeriodStart,
  );

  const [
    periodEnd,
    setPeriodEnd,
  ] = useState(
    cost?.periodEnd ??
      defaultPeriodEnd,
  );

  const [
    note,
    setNote,
  ] = useState(
    cost?.note ??
      "",
  );

  const [
    error,
    setError,
  ] = useState("");

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const isEdit =
    Boolean(cost);

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    startTransition(
      async () => {
        const input = {
          name,
          category,
          amount,
          periodStart,
          periodEnd,
          note,
        };

        const result =
          cost
            ? await updateRoutineCost(
                cost.id,
                input,
              )
            : await createRoutineCost(
                input,
              );

        if (
          !result.success
        ) {
          setError(
            result.error,
          );
          return;
        }

        router.refresh();
        onClose();
      },
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Tutup"
        className="absolute inset-0 cursor-default bg-black/40"
        onClick={onClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="routine-cost-dialog-title"
        className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:max-w-lg sm:rounded-[12px]"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-white p-5">
          <div>
            <h2
              id="routine-cost-dialog-title"
              className="font-semibold text-foreground"
            >
              {isEdit
                ? "Edit Biaya Rutin"
                : "Tambah Biaya Rutin"}
            </h2>

            <p className="mt-1 text-sm text-muted">
              Simpan nominal untuk seluruh periode. Alokasi harian dihitung otomatis.
            </p>
          </div>

          <button
            type="button"
            aria-label="Tutup"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-[#F3F4F6]"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-5 p-5"
        >
          {error ? (
            <div
              role="alert"
              className="rounded-[10px] border border-[#FECACA] bg-danger-soft p-3 text-sm text-danger"
            >
              {error}
            </div>
          ) : null}

          <Input
            label="Nama"
            placeholder="Contoh: Gaji Karyawan"
            maxLength={120}
            value={name}
            disabled={
              isPending
            }
            onChange={(
              event,
            ) =>
              setName(
                event.target.value,
              )
            }
          />

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="routine-cost-category"
              className="text-[13px] font-medium text-foreground"
            >
              Kategori
            </label>

            <select
              id="routine-cost-category"
              value={
                category
              }
              disabled={
                isPending
              }
              onChange={(
                event,
              ) =>
                setCategory(
                  event.target
                    .value as RoutineCostCategoryValue,
                )
              }
              className="h-11 w-full rounded-[10px] border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-[#F3F4F6]"
            >
              {ROUTINE_COST_CATEGORY_VALUES.map(
                (
                  value,
                ) => (
                  <option
                    key={
                      value
                    }
                    value={
                      value
                    }
                  >
                    {
                      ROUTINE_COST_CATEGORY_LABELS[
                        value
                      ]
                    }
                  </option>
                ),
              )}
            </select>
          </div>

          <Input
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            label="Nominal"
            placeholder="9300000"
            value={
              amount
            }
            disabled={
              isPending
            }
            onChange={(
              event,
            ) =>
              setAmount(
                event.target.value,
              )
            }
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              type="date"
              label="Tanggal Mulai"
              value={
                periodStart
              }
              max={
                periodEnd ||
                undefined
              }
              disabled={
                isPending
              }
              onChange={(
                event,
              ) =>
                setPeriodStart(
                  event.target.value,
                )
              }
            />

            <Input
              type="date"
              label="Tanggal Selesai"
              value={
                periodEnd
              }
              min={
                periodStart ||
                undefined
              }
              disabled={
                isPending
              }
              onChange={(
                event,
              ) =>
                setPeriodEnd(
                  event.target.value,
                )
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="routine-cost-note"
              className="text-[13px] font-medium text-foreground"
            >
              Catatan
            </label>

            <textarea
              id="routine-cost-note"
              rows={3}
              maxLength={1000}
              placeholder="Opsional"
              value={note}
              disabled={
                isPending
              }
              onChange={(
                event,
              ) =>
                setNote(
                  event.target.value,
                )
              }
              className="w-full resize-y rounded-[10px] border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-light focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-[#F3F4F6]"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="secondary"
              disabled={
                isPending
              }
              onClick={
                onClose
              }
            >
              Batal
            </Button>

            <Button
              type="submit"
              disabled={
                isPending
              }
            >
              {isPending
                ? "Menyimpan..."
                : isEdit
                  ? "Simpan Perubahan"
                  : "Tambah Biaya"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}