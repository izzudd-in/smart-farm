"use client";

import {
  type FormEvent,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

import {
  createEggOpeningStock,
  createEggStockAdjustment,
} from "@/features/inventory/actions/egg-stock";
import { getJakartaTodayString } from "@/features/daily-operations/utils/date";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { InventoryModal } from "./inventory-modal";

type EggStockFormDialogProps = {
  mode:
    | "opening"
    | "adjustment";

  onClose: () => void;
};

export function EggStockFormDialog({
  mode,
  onClose,
}: EggStockFormDialogProps) {
  const router = useRouter();

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

  const [type, setType] =
    useState<
      "INCREASE" | "DECREASE"
    >("DECREASE");

  const [note, setNote] =
    useState("");

  const [error, setError] =
    useState("");

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const isOpening =
    mode === "opening";

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    startTransition(
      async () => {
        const result =
          isOpening
            ? await createEggOpeningStock(
                {
                  occurredAt,
                  quantityKg,
                  note,
                },
              )
            : await createEggStockAdjustment(
                {
                  occurredAt,
                  quantityKg,
                  type,
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
        isOpening
          ? "Stok Awal Telur"
          : "Koreksi Stok Telur"
      }
      description={
        isOpening
          ? "Stok awal hanya dapat dicatat satu kali."
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

        {!isOpening ? (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="egg-adjustment-type"
              className="text-[13px] font-medium text-foreground"
            >
              Tipe
            </label>

            <select
              id="egg-adjustment-type"
              value={type}
              disabled={isPending}
              onChange={(event) =>
                setType(
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
          label="Tanggal"
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
            htmlFor="egg-stock-note"
            className="text-[13px] font-medium text-foreground"
          >
            {isOpening
              ? "Catatan"
              : "Alasan"}
          </label>

          <textarea
            id="egg-stock-note"
            rows={3}
            maxLength={1000}
            value={note}
            disabled={isPending}
            placeholder={
              isOpening
                ? "Opsional"
                : "Contoh: selisih timbang atau telur pecah"
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
              : "Simpan Movement"}
          </Button>
        </div>
      </form>
    </InventoryModal>
  );
}