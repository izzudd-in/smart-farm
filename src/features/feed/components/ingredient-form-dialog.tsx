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
};

export function IngredientFormDialog({
  ingredient,
  onClose,
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

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    startTransition(async () => {
      const input = {
        name,
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
          placeholder="Jagung"
          value={name}
          disabled={isPending}
          onChange={(event) =>
            setName(event.target.value)
          }
        />

        <Input
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          label="Harga / kg"
          placeholder="5500"
          value={currentPricePerKg}
          disabled={isPending}
          onChange={(event) =>
            setCurrentPricePerKg(
              event.target.value,
            )
          }
        />

        <div className="rounded-[10px] bg-[#F9FAFB] p-3 text-xs text-muted">
          Unit bahan pakan: kg
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
              : "Simpan"}
          </Button>
        </div>
      </form>
    </FeedModal>
  );
}