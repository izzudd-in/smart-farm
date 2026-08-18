"use client";

import {
  type FormEvent,
  useState,
  useTransition,
} from "react";

import {
  startFlock,
  updateFlock,
} from "@/features/farm/actions/farm";
import type {
  FlockSummary,
  KandangSummary,
} from "@/features/farm/types/farm";
import { getJakartaDateString } from "@/features/farm/utils/flock-age";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { FarmModal } from "./farm-modal";

type FlockFormDialogProps = {
  kandang: KandangSummary;
  flock?: FlockSummary;
  onClose: () => void;
};

export function FlockFormDialog({
  kandang,
  flock,
  onClose,
}: FlockFormDialogProps) {
  const isEditing = Boolean(flock);

  const [name, setName] = useState(
    flock?.name ?? "",
  );

  const [startDate, setStartDate] =
    useState(
      flock?.startDate ??
        getJakartaDateString(),
    );

  const [
    initialPopulation,
    setInitialPopulation,
  ] = useState(
    flock?.initialPopulation.toString() ??
      "",
  );

  const [error, setError] = useState("");
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
        startDate,
        initialPopulation: Number(
          initialPopulation,
        ),
      };

      const result =
        flock
          ? await updateFlock(
              flock.id,
              input,
            )
          : await startFlock(
              kandang.id,
              input,
            );

      if (!result.success) {
        setError(result.error);
        return;
      }

      onClose();
    });
  }

  return (
    <FarmModal
      title={
        isEditing
          ? "Edit Flock"
          : "Mulai Flock Baru"
      }
      description={`${kandang.code} · ${kandang.name}`}
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

        {!isEditing &&
        kandang.activeFlock ? (
          <div className="rounded-[10px] border border-[#FDE68A] bg-[#FFFBEB] p-3 text-sm text-[#92400E]">
            Memulai flock baru akan
            mengakhiri flock aktif saat
            ini pada tanggal mulai flock
            baru.
          </div>
        ) : null}

        <Input
          label="Nama / Batch Flock"
          value={name}
          placeholder="Flock A 2026"
          disabled={isPending}
          onChange={(event) =>
            setName(event.target.value)
          }
        />

        <Input
          type="date"
          label="Tanggal Mulai"
          value={startDate}
          disabled={isPending}
          onChange={(event) =>
            setStartDate(
              event.target.value,
            )
          }
        />

        <Input
          type="number"
          label="Populasi Awal"
          min={1}
          step={1}
          inputMode="numeric"
          value={initialPopulation}
          placeholder="5000"
          disabled={isPending}
          onChange={(event) =>
            setInitialPopulation(
              event.target.value,
            )
          }
        />

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
              : isEditing
                ? "Simpan Perubahan"
                : "Mulai Flock"}
          </Button>
        </div>
      </form>
    </FarmModal>
  );
}