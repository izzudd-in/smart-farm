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
};

export function EggPriceFormDialog({
  onClose,
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

    startTransition(async () => {
      const result =
        await createEggPrice({
          pricePerKg,
          effectiveAt,
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
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          label="Harga / kg"
          placeholder="28000"
          value={pricePerKg}
          disabled={isPending}
          onChange={(event) =>
            setPricePerKg(
              event.target.value,
            )
          }
        />

        <Input
          type="date"
          label="Berlaku Mulai"
          value={effectiveAt}
          disabled={isPending}
          onChange={(event) =>
            setEffectiveAt(
              event.target.value,
            )
          }
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