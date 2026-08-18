"use client";

import {
  type FormEvent,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  getJakartaTodayString,
} from "@/features/daily-operations/utils/date";

import {
  createFeedOpeningStock,
  createFeedPurchase,
  createFeedStockAdjustment,
} from "@/features/inventory/actions/feed-stock";

import type {
  FeedInventoryIngredientOption,
} from "@/features/inventory/types/inventory";

import {
  calculateFeedPurchaseTotal,
} from "@/features/inventory/utils/feed-stock";

import { InventoryModal } from "./inventory-modal";

type FeedStockFormDialogProps = {
  mode:
    | "purchase"
    | "opening"
    | "adjustment";

  ingredients:
    FeedInventoryIngredientOption[];

  selectedIngredientId?: string;

  onClose: () => void;
};

const currencyFormatter =
  new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 2,
    },
  );

export function FeedStockFormDialog({
  mode,
  ingredients,
  selectedIngredientId,
  onClose,
}: FeedStockFormDialogProps) {
  const router = useRouter();

  const purchaseMode =
    mode === "purchase";

  const openingMode =
    mode === "opening";

  const selectableIngredients =
    purchaseMode
      ? ingredients.filter(
          (ingredient) =>
            ingredient.isActive,
        )
      : ingredients;

  const [
    ingredientId,
    setIngredientId,
  ] = useState(
    selectedIngredientId ??
      "",
  );

  const [
    occurredAt,
    setOccurredAt,
  ] = useState(
    getJakartaTodayString(),
  );

  const [
    quantityKg,
    setQuantityKg,
  ] = useState("");

  const [
    unitPricePerKg,
    setUnitPricePerKg,
  ] = useState("");

  const [
    supplier,
    setSupplier,
  ] = useState("");

  const [note, setNote] =
    useState("");

  const [
    adjustmentType,
    setAdjustmentType,
  ] = useState<
    "INCREASE" | "DECREASE"
  >("DECREASE");

  const [error, setError] =
    useState("");

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const selectedIngredient =
    ingredients.find(
      (ingredient) =>
        ingredient.id ===
        ingredientId,
    );

  const purchasePreview =
    useMemo(() => {
      if (
        !purchaseMode ||
        !quantityKg ||
        !unitPricePerKg
      ) {
        return null;
      }

      try {
        return calculateFeedPurchaseTotal(
          quantityKg,
          unitPricePerKg,
        );
      } catch {
        return null;
      }
    }, [
      purchaseMode,
      quantityKg,
      unitPricePerKg,
    ]);

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    startTransition(
      async () => {
        const result =
          purchaseMode
            ? await createFeedPurchase(
                {
                  ingredientId,
                  purchasedAt:
                    occurredAt,
                  quantityKg,
                  unitPricePerKg,
                  supplier,
                  note,
                },
              )
            : openingMode
              ? await createFeedOpeningStock(
                  {
                    ingredientId,
                    occurredAt,
                    quantityKg,
                    note,
                  },
                )
              : await createFeedStockAdjustment(
                  {
                    ingredientId,
                    occurredAt,
                    type:
                      adjustmentType,
                    quantityKg,
                    note,
                  },
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
    <InventoryModal
      title={
        purchaseMode
          ? "Pembelian Pakan"
          : openingMode
            ? "Stok Awal Pakan"
            : "Koreksi Stok Pakan"
      }
      description={
        purchaseMode
          ? "Harga pembelian disimpan sebagai snapshot transaksi. Belum digunakan sebagai valuation/HPP."
          : openingMode
            ? "Stok awal hanya dapat dibuat satu kali per bahan pakan."
            : "Koreksi membuat movement baru dan tidak mengubah history lama."
      }
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit}
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

        {openingMode &&
        selectedIngredient ? (
          <div className="rounded-[10px] border border-border bg-[#F9FAFB] p-3">
            <p className="text-xs text-muted">
              Bahan Pakan
            </p>

            <p className="mt-1 text-sm font-semibold text-foreground">
              {
                selectedIngredient.name
              }
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="feed-stock-ingredient"
              className="text-[13px] font-medium text-foreground"
            >
              Bahan Pakan
            </label>

            <select
              id="feed-stock-ingredient"
              value={ingredientId}
              disabled={isPending}
              onChange={(event) =>
                setIngredientId(
                  event.target.value,
                )
              }
              className="h-11 w-full rounded-[10px] border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-[#F3F4F6]"
            >
              <option value="">
                Pilih bahan
              </option>

              {selectableIngredients.map(
                (ingredient) => (
                  <option
                    key={
                      ingredient.id
                    }
                    value={
                      ingredient.id
                    }
                  >
                    {
                      ingredient.name
                    }
                    {!ingredient.isActive
                      ? " (Nonaktif)"
                      : ""}
                  </option>
                ),
              )}
            </select>
          </div>
        )}

        {!purchaseMode &&
        !openingMode ? (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="feed-adjustment-type"
              className="text-[13px] font-medium text-foreground"
            >
              Tipe
            </label>

            <select
              id="feed-adjustment-type"
              value={
                adjustmentType
              }
              disabled={isPending}
              onChange={(event) =>
                setAdjustmentType(
                  event.target
                    .value as
                    | "INCREASE"
                    | "DECREASE",
                )
              }
              className="h-11 w-full rounded-[10px] border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-[#F3F4F6]"
            >
              <option value="INCREASE">
                Tambah
              </option>

              <option value="DECREASE">
                Kurangi
              </option>
            </select>
          </div>
        ) : null}

        <Input
          type="date"
          label={
            purchaseMode
              ? "Tanggal Pembelian"
              : "Tanggal"
          }
          value={occurredAt}
          disabled={isPending}
          onChange={(event) =>
            setOccurredAt(
              event.target.value,
            )
          }
        />

        <Input
          type="number"
          inputMode="decimal"
          min="0.001"
          step="0.001"
          label="Jumlah (kg)"
          placeholder="500"
          value={quantityKg}
          disabled={isPending}
          onChange={(event) =>
            setQuantityKg(
              event.target.value,
            )
          }
        />

        {purchaseMode ? (
          <>
            <Input
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              label="Harga / kg"
              placeholder="5500"
              value={
                unitPricePerKg
              }
              disabled={isPending}
              onChange={(event) =>
                setUnitPricePerKg(
                  event.target.value,
                )
              }
            />

            <Input
              label="Supplier"
              placeholder="Opsional"
              value={supplier}
              disabled={isPending}
              onChange={(event) =>
                setSupplier(
                  event.target.value,
                )
              }
            />

            {purchasePreview ? (
              <div className="rounded-[10px] bg-[#F9FAFB] p-4">
                <p className="text-xs text-muted">
                  Estimasi Total
                </p>

                <p className="mt-1 text-lg font-semibold text-foreground">
                  {currencyFormatter.format(
                    Number(
                      purchasePreview,
                    ),
                  )}
                </p>

                <p className="mt-1 text-xs text-muted">
                  Total final dihitung ulang oleh server saat disimpan.
                </p>
              </div>
            ) : null}
          </>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="feed-stock-note"
            className="text-[13px] font-medium text-foreground"
          >
            {mode === "adjustment"
              ? "Alasan"
              : "Catatan"}
          </label>

          <textarea
            id="feed-stock-note"
            rows={3}
            maxLength={1000}
            value={note}
            disabled={isPending}
            placeholder={
              mode === "adjustment"
                ? "Contoh: selisih timbang atau penyesuaian fisik"
                : "Opsional"
            }
            onChange={(event) =>
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
            disabled={isPending}
            onClick={onClose}
          >
            Batal
          </Button>

          <Button
            type="submit"
            disabled={isPending}
          >
            {isPending
              ? "Menyimpan..."
              : purchaseMode
                ? "Simpan Pembelian"
                : "Simpan Movement"}
          </Button>
        </div>
      </form>
    </InventoryModal>
  );
}