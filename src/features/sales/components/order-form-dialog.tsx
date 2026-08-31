"use client";

import {
  type FormEvent,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import {
  createOrder,
  getOrderPricingPreview,
} from "@/features/sales/actions/sales";
import type {
  CustomerView,
  OrderPricingPreviewResult,
} from "@/features/sales/types/sales";
import { calculateOrderTotal } from "@/features/sales/utils/pricing";

import { SalesModal } from "./sales-modal";

type OrderFormDialogProps = {
  customers: CustomerView[];
  defaultOrderedAt: string;
  onClose: () => void;
  onSuccess?: (message: string) => void;
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

function formatMoney(
  value: string,
): string {
  return currencyFormatter.format(
    Number(value),
  );
}

export function OrderFormDialog({
  customers,
  defaultOrderedAt,
  onClose,
  onSuccess,
}: OrderFormDialogProps) {
  const router = useRouter();

  const [
    customerId,
    setCustomerId,
  ] = useState("");

  const [
    orderedAt,
    setOrderedAt,
  ] = useState(
    defaultOrderedAt,
  );

  const [
    quantityKg,
    setQuantityKg,
  ] = useState("");

  const [note, setNote] =
    useState("");

  const [
    preview,
    setPreview,
  ] = useState<
    Extract<
      OrderPricingPreviewResult,
      {
        success: true;
      }
    > | null
  >(null);

  const [
    previewError,
    setPreviewError,
  ] = useState("");

  const [
    isPreviewLoading,
    setIsPreviewLoading,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [
    isPending,
    startTransition,
  ] = useTransition();

  async function fetchPreview(
    cId: string,
    oDate: string,
  ) {
    if (!cId || !oDate) {
      setPreview(null);
      setPreviewError("");
      return;
    }

    setIsPreviewLoading(true);
    setPreviewError("");

    try {
      const result =
        await getOrderPricingPreview({
          customerId: cId,
          orderedAt: oDate,
        });

      if (result.success) {
        setPreview(result);
        setPreviewError("");
      } else {
        setPreview(null);
        setPreviewError(
          result.error,
        );
      }
    } catch {
      setPreview(null);
      setPreviewError(
        "Gagal memuat preview harga.",
      );
    } finally {
      setIsPreviewLoading(
        false,
      );
    }
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    if (!customerId) {
      setError("Customer wajib dipilih.");
      return;
    }

    if (!orderedAt) {
      setError("Tanggal order wajib diisi.");
      return;
    }

    const trimmedQty = quantityKg.trim().replace(",", ".");
    if (!trimmedQty) {
      setError("Jumlah telur wajib diisi.");
      return;
    }

    const qtyNum = Number(trimmedQty);
    if (
      Number.isNaN(qtyNum) ||
      qtyNum <= 0 ||
      !/^\d+(\.\d{1,3})?$/.test(trimmedQty)
    ) {
      setError(
        "Jumlah telur harus lebih dari 0 kg dengan maksimal 3 angka desimal.",
      );
      return;
    }

    if (
      preview?.availableStockKg !== undefined &&
      qtyNum > Number(preview.availableStockKg)
    ) {
      setError(
        `Stok telur tidak mencukupi. Stok tersedia: ${preview.availableStockKg} kg, jumlah order: ${trimmedQty} kg.`,
      );
      return;
    }

    startTransition(async () => {
      const result =
        await createOrder({
          customerId,
          orderedAt,
          quantityKg: trimmedQty,
          note: note.trim(),
        });

      if (!result.success) {
        setError(
          result.error,
        );
        return;
      }

      onSuccess?.(result.message);
      router.refresh();
      onClose();
    });
  }

  const normalizedQty = quantityKg.trim().replace(",", ".");
  const isQtyValid =
    Boolean(normalizedQty) &&
    !Number.isNaN(Number(normalizedQty)) &&
    Number(normalizedQty) > 0 &&
    /^\d+(\.\d{1,3})?$/.test(normalizedQty);

  const isStockExceeded =
    Boolean(preview?.availableStockKg) &&
    isQtyValid &&
    Number(normalizedQty) > Number(preview?.availableStockKg);

  return (
    <SalesModal
      title="Order Baru"
      description="Harga final dan ketersediaan stok diverifikasi saat order disimpan."
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

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="order-customer"
            className="text-[13px] font-medium text-foreground"
          >
            Customer
          </label>

          <select
            id="order-customer"
            value={customerId}
            disabled={isPending}
            onChange={(event) => {
              const val =
                event.target.value;
              setCustomerId(val);
              if (error) setError("");
              void fetchPreview(
                val,
                orderedAt,
              );
            }}
            className="h-11 w-full rounded-[10px] border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-[#F3F4F6]"
          >
            <option value="">
              Pilih customer
            </option>

            {customers.map(
              (customer) => (
                <option
                  key={
                    customer.id
                  }
                  value={
                    customer.id
                  }
                >
                  {customer.name}
                </option>
              ),
            )}
          </select>

          {customers.length === 0 ? (
            <p className="text-xs text-[#B45309]">
              Belum ada customer aktif.
            </p>
          ) : null}
        </div>

        <DatePicker
          id="order-date"
          label="Tanggal Order"
          value={orderedAt}
          disabled={isPending}
          onChange={(val) => {
            setOrderedAt(val);
            if (error) setError("");
            void fetchPreview(
              customerId,
              val,
            );
          }}
        />

        <Input
          id="order-quantity"
          type="number"
          inputMode="decimal"
          min="0.001"
          step="0.001"
          label="Jumlah Telur (kg)"
          placeholder="100"
          value={quantityKg}
          disabled={isPending}
          onChange={(event) => {
            setQuantityKg(
              event.target.value,
            );
            if (error) setError("");
          }}
        />

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="order-note"
            className="text-[13px] font-medium text-foreground"
          >
            Catatan
          </label>

          <textarea
            id="order-note"
            rows={3}
            maxLength={1000}
            value={note}
            disabled={isPending}
            placeholder="Opsional"
            onChange={(event) => {
              setNote(
                event.target.value,
              );
              if (error) setError("");
            }}
            className="w-full resize-y rounded-[10px] border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-light focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-[#F3F4F6]"
          />
        </div>

        {customerId &&
        orderedAt ? (
          <div className="rounded-[10px] border border-border bg-[#F9FAFB] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Preview Harga & Stok
            </p>

            {isPreviewLoading ? (
              <p className="mt-3 text-sm text-muted">
                Memuat preview harga & stok...
              </p>
            ) : previewError ? (
              <p className="mt-3 text-sm text-danger">
                {previewError}
              </p>
            ) : preview ? (
              <div className="mt-3 space-y-2.5 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted">
                    Harga dasar
                  </span>

                  <span className="font-medium text-foreground">
                    {formatMoney(
                      preview.basePricePerKg,
                    )}
                    /kg
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-muted">
                    Diskon
                  </span>

                  <span className="font-medium text-foreground">
                    {formatMoney(
                      preview.discountPerKg,
                    )}
                    /kg
                  </span>
                </div>

                <div className="flex justify-between gap-4 border-t border-border pt-2">
                  <span className="text-muted">
                    Harga final
                  </span>

                  <span className="font-semibold text-primary-hover">
                    {formatMoney(
                      preview.finalPricePerKg,
                    )}
                    /kg
                  </span>
                </div>

                {preview.availableStockKg !== undefined ? (
                  <div className="flex justify-between gap-4 border-t border-border pt-2 text-xs">
                    <span className="text-muted">
                      Stok telur tersedia
                    </span>

                    <span
                      className={`font-semibold ${
                        isStockExceeded
                          ? "text-danger"
                          : "text-foreground"
                      }`}
                    >
                      {preview.availableStockKg} kg
                    </span>
                  </div>
                ) : null}

                {isQtyValid ? (
                  <div className="flex justify-between gap-4 border-t border-dashed border-border pt-2">
                    <span className="font-medium text-foreground">
                      Estimasi Total (
                      {normalizedQty} kg)
                    </span>

                    <span className="font-bold text-primary">
                      {formatMoney(
                        calculateOrderTotal(
                          normalizedQty,
                          preview.finalPricePerKg,
                        ),
                      )}
                    </span>
                  </div>
                ) : null}

                {isStockExceeded ? (
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#FECACA] bg-danger-soft p-2.5 text-xs text-danger">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>
                      Jumlah order ({normalizedQty} kg) melebihi stok yang tersedia (
                      {preview.availableStockKg} kg).
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

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
            disabled={
              isPending ||
              isPreviewLoading ||
              !preview ||
              customers.length ===
                0
            }
          >
            {isPending
              ? "Menyimpan..."
              : "Simpan Order"}
          </Button>
        </div>
      </form>
    </SalesModal>
  );
}