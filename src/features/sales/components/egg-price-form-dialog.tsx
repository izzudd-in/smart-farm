"use client";

import {
  type FormEvent,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createEggPrice } from "@/features/sales/actions/sales";
import { getJakartaTodayString } from "@/features/daily-operations/utils/date";

import { SalesModal } from "./sales-modal";

type EggPriceFormDialogProps = {
  onClose: () => void;
  onSuccess?: (message: string) => void;
};

export function EggPriceFormDialog({
  onClose,
  onSuccess,
}: EggPriceFormDialogProps) {
  const router = useRouter();

  const [
    pricePerKg,
    setPricePerKg,
  ] = useState("");

  const [
    effectiveAt,
    setEffectiveAt,
  ] = useState(
    getJakartaTodayString(),
  );

  const [error, setError] =
    useState("");

  const [isPending, startTransition] =
    useTransition();

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    const trimmedPrice = pricePerKg.trim().replace(",", ".");
    const trimmedDate = effectiveAt.trim();

    if (!trimmedPrice) {
      setError("Harga/kg wajib diisi.");
      return;
    }

    const priceNum = Number(trimmedPrice);
    if (
      Number.isNaN(priceNum) ||
      priceNum <= 0 ||
      !/^\d+(\.\d{1,2})?$/.test(trimmedPrice)
    ) {
      setError("Harga/kg harus lebih dari 0.");
      return;
    }

    if (!trimmedDate) {
      setError("Tanggal berlaku wajib diisi.");
      return;
    }

    startTransition(async () => {
      const result =
        await createEggPrice({
          pricePerKg: trimmedPrice,
          effectiveAt: trimmedDate,
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

  return (
    <SalesModal
      title="Update Harga Telur"
      description="Harga lama tetap tersimpan sebagai riwayat."
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

        <Input
          id="egg-price-input"
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          label="Harga / kg"
          placeholder="28000"
          value={pricePerKg}
          disabled={isPending}
          onChange={(event) => {
            setPricePerKg(
              event.target.value,
            );
            if (error) setError("");
          }}
        />

        <Input
          id="egg-price-effective-at"
          type="date"
          label="Berlaku Mulai"
          value={effectiveAt}
          disabled={isPending}
          onChange={(event) => {
            setEffectiveAt(
              event.target.value,
            );
            if (error) setError("");
          }}
        />

        <div className="rounded-[10px] bg-[#F9FAFB] p-3 text-xs leading-5 text-muted">
          Menyimpan harga baru tidak
          mengubah record harga lama.
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
              : "Simpan Harga"}
          </Button>
        </div>
      </form>
    </SalesModal>
  );
}