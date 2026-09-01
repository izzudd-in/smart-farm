"use client";

import {
  type FormEvent,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

import {
  createFeedIngredient,
  updateFeedIngredient,
} from "@/features/feed/actions/feed";
import type { FeedIngredientView } from "@/features/feed/types/feed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { FeedModal } from "./feed-modal";

type IngredientFormDialogProps = {
  ingredient?: FeedIngredientView;
  onClose: () => void;
  onSuccess?: (message: string) => void;
};

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 2,
});

export function IngredientFormDialog({
  ingredient,
  onClose,
  onSuccess,
}: IngredientFormDialogProps) {
  const router = useRouter();

  const [name, setName] = useState(
    ingredient?.name ?? "",
  );

  const [
    currentPricePerKg,
    setCurrentPricePerKg,
  ] = useState(
    ingredient?.currentPricePerKg ??
      "",
  );

  const [error, setError] =
    useState("");

  const [isPending, startTransition] =
    useTransition();

  const parsedPriceNumber = (() => {
    const cleaned = currentPricePerKg.trim().replace(",", ".");
    if (!cleaned) return null;
    const num = Number(cleaned);
    return Number.isFinite(num) && num >= 0 ? num : null;
  })();

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Nama bahan pakan wajib diisi.");
      return;
    }

    if (!currentPricePerKg.trim()) {
      setError("Harga/kg wajib diisi.");
      return;
    }

    if (parsedPriceNumber === null) {
      setError("Harga/kg harus berupa angka 0 atau lebih dengan maksimal 2 desimal.");
      return;
    }

    if (parsedPriceNumber > 100_000_000) {
      setError("Harga/kg tidak boleh melebihi Rp 100.000.000.");
      return;
    }

    startTransition(async () => {
      const input = {
        name: trimmedName,
        currentPricePerKg,
      };

      const result = ingredient
        ? await updateFeedIngredient(
            ingredient.id,
            input,
          )
        : await createFeedIngredient(
            input,
          );

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
    <FeedModal
      title={
        ingredient
          ? "Edit Bahan Pakan"
          : "Tambah Bahan Pakan"
      }
      description="Harga digunakan sebagai estimasi biaya formula saat ini."
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
          label="Nama Bahan"
          placeholder="Jagung, Konsentrat, Dedak..."
          value={name}
          disabled={isPending}
          autoFocus
          onChange={(event) => {
            setName(event.target.value);
            if (error) setError("");
          }}
        />

        <div>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            label="Harga / kg"
            placeholder="Contoh: 5500"
            value={currentPricePerKg}
            disabled={isPending}
            onChange={(event) => {
              setCurrentPricePerKg(
                event.target.value,
              );
              if (error) setError("");
            }}
          />

          {parsedPriceNumber !== null ? (
            <p className="mt-1 text-xs text-muted">
              Format: <span className="font-medium text-foreground">{currencyFormatter.format(parsedPriceNumber)}</span> / kg
            </p>
          ) : null}
        </div>

        <div className="rounded-[10px] bg-[#F9FAFB] p-3 text-xs text-muted">
          Unit bahan pakan: <strong>kg</strong> (Kilogram) • <span className="text-foreground/80">Konversi: 1 kuintal (kw) = 100 kg, 1 ton = 1.000 kg</span>
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
              : ingredient
                ? "Simpan Perubahan"
                : "Tambah Bahan"}
          </Button>
        </div>
      </form>
    </FeedModal>
  );
}