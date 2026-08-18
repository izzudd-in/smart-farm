"use client";

import {
  type FormEvent,
  useEffect,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createOrder,
  getOrderPricingPreview,
} from "@/features/sales/actions/sales";
import type {
  CustomerView,
  OrderPricingPreviewResult,
} from "@/features/sales/types/sales";

import { SalesModal } from "./sales-modal";

type OrderFormDialogProps = {
  customers: CustomerView[];
  defaultOrderedAt: string;
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

  useEffect(() => {
    let active = true;

    async function loadPreview() {
      if (!customerId || !orderedAt) {
        setIsPreviewLoading(false);
        setPreview(null);
        setPreviewError("");
        return;
      }

      setIsPreviewLoading(true);
      setPreview(null);
      setPreviewError("");

      const result = await getOrderPricingPreview({
        customerId,
        orderedAt,
      });

      if (!active) {
        return;
      }

      setIsPreviewLoading(false);

      if (!result.success) {
        setPreviewError(result.error);
        return;
      }

      setPreview(result);
    }

    void loadPreview();

    return () => {
      active = false;
    };
  }, [customerId, orderedAt]);

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    startTransition(async () => {
      const result =
        await createOrder({
          customerId,
          orderedAt,
          quantityKg,
          note,
        });

      if (!result.success) {
        setError(
          result.error,
        );
        return;
      }

      router.refresh();
      onClose();
    });
  }

  return (
    <SalesModal
      title="Order Baru"
      description="Harga final dihitung ulang oleh server saat order disimpan."
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
            onChange={(event) =>
              setCustomerId(
                event.target.value,
              )
            }
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

        <Input
          type="date"
          label="Tanggal Order"
          value={orderedAt}
          disabled={isPending}
          onChange={(event) =>
            setOrderedAt(
              event.target.value,
            )
          }
        />

        <Input
          type="number"
          inputMode="decimal"
          min="0.001"
          step="0.001"
          label="Jumlah Telur (kg)"
          placeholder="100"
          value={quantityKg}
          disabled={isPending}
          onChange={(event) =>
            setQuantityKg(
              event.target.value,
            )
          }
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
            onChange={(event) =>
              setNote(
                event.target.value,
              )
            }
            className="w-full resize-y rounded-[10px] border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-light focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-[#F3F4F6]"
          />
        </div>

        {customerId &&
        orderedAt ? (
          <div className="rounded-[10px] border border-border bg-[#F9FAFB] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Preview Harga
            </p>

            {isPreviewLoading ? (
              <p className="mt-3 text-sm text-muted">
                Memuat harga...
              </p>
            ) : previewError ? (
              <p className="mt-3 text-sm text-danger">
                {previewError}
              </p>
            ) : preview ? (
              <div className="mt-3 space-y-2 text-sm">
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
                    Estimasi harga
                  </span>

                  <span className="font-semibold text-primary-hover">
                    {formatMoney(
                      preview.finalPricePerKg,
                    )}
                    /kg
                  </span>
                </div>
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