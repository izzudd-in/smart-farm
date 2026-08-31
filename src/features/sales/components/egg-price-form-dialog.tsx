"use client";

import {
  type FormEvent,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Clock, History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { createEggPrice } from "@/features/sales/actions/sales";
import { getJakartaTodayString } from "@/features/daily-operations/utils/date";
import type { EggPriceView } from "@/features/sales/types/sales";

import { SalesModal } from "./sales-modal";

type EggPriceFormDialogProps = {
  activePrice?: EggPriceView | null;
  latestPrice?: EggPriceView | null;
  onClose: () => void;
  onSuccess?: (message: string) => void;
};

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 2,
});

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function EggPriceFormDialog({
  latestPrice,
  onClose,
  onSuccess,
}: EggPriceFormDialogProps) {
  const router = useRouter();

  const [pricePerKg, setPricePerKg] = useState("");
  const [effectiveAt, setEffectiveAt] = useState(getJakartaTodayString());
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
      const result = await createEggPrice({
        pricePerKg: trimmedPrice,
        effectiveAt: trimmedDate,
      });

      if (!result.success) {
        setError(result.error);
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
      description="Harga lama tetap tersimpan sebagai histori dengan timestamp."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-5 p-5">
        {error ? (
          <div
            role="alert"
            className="rounded-[10px] border border-[#FECACA] bg-danger-soft p-3 text-sm text-danger"
          >
            {error}
          </div>
        ) : null}

        {/* Latest Price & Timestamp Info Card */}
        {latestPrice ? (
          <div className="rounded-[10px] border border-border bg-[#F9FAFB] p-3.5 text-xs text-muted space-y-1.5">
            <div className="flex items-center justify-between font-medium text-foreground">
              <span className="flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-muted" />
                Harga Terakhir:
              </span>
              <span className="font-semibold text-primary">
                {currencyFormatter.format(Number(latestPrice.pricePerKg))}/kg
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span>Berlaku sejak:</span>
              <span className="font-medium text-foreground">
                {formatDate(latestPrice.effectiveAt)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted" />
                Waktu perubahan:
              </span>
              <span className="text-foreground">
                {formatDateTime(latestPrice.createdAt)} WIB
              </span>
            </div>
          </div>
        ) : null}

        <Input
          id="egg-price-input"
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          label="Harga Baru / kg (Rp)"
          placeholder="28000"
          value={pricePerKg}
          disabled={isPending}
          onChange={(event) => {
            setPricePerKg(event.target.value);
            if (error) setError("");
          }}
        />

        <DatePicker
          id="egg-price-effective-at"
          label="Berlaku Mulai Tanggal"
          value={effectiveAt}
          disabled={isPending}
          onChange={(val) => {
            setEffectiveAt(val);
            if (error) setError("");
          }}
        />

        <div className="rounded-[10px] bg-[#F9FAFB] p-3 text-xs leading-5 text-muted">
          Menyimpan harga baru tidak menghapus record lama. Transaksi akan menggunakan harga yang berlaku pada tanggal order masing-masing.
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

          <Button type="submit" disabled={isPending}>
            {isPending ? "Menyimpan..." : "Simpan Harga"}
          </Button>
        </div>
      </form>
    </SalesModal>
  );
}