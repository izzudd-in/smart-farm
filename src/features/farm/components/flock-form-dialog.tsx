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
  onSuccess?: (message: string) => void;
};

export function FlockFormDialog({
  kandang,
  flock,
  onClose,
  onSuccess,
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

  const [
    confirmEndActiveFlock,
    setConfirmEndActiveFlock,
  ] = useState(false);

  const [error, setError] = useState("");
  const [isPending, startTransition] =
    useTransition();

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Nama flock wajib diisi.");
      return;
    }

    if (trimmedName.length > 100) {
      setError("Nama flock maksimal 100 karakter.");
      return;
    }

    if (!startDate) {
      setError("Tanggal mulai tidak valid.");
      return;
    }

    const todayStr = getJakartaDateString();
    if (startDate > todayStr) {
      setError("Tanggal mulai tidak boleh di masa depan.");
      return;
    }

    if (!isEditing && kandang.activeFlock) {
      if (startDate < kandang.activeFlock.startDate) {
        setError(
          "Tanggal flock baru tidak boleh lebih awal dari flock aktif.",
        );
        return;
      }

      if (!confirmEndActiveFlock) {
        setError(
          "Silakan centang konfirmasi pengakhiran flock aktif terlebih dahulu.",
        );
        return;
      }
    }

    const populationNumber = Number(initialPopulation);
    if (!Number.isInteger(populationNumber) || populationNumber <= 0) {
      setError("Populasi awal harus berupa angka bulat lebih dari 0.");
      return;
    }

    startTransition(async () => {
      const input = {
        name: trimmedName,
        startDate,
        initialPopulation: populationNumber,
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

      onSuccess?.(result.message);
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
          <div className="space-y-2.5">
            <div className="rounded-[10px] border border-[#FDE68A] bg-[#FFFBEB] p-3 text-xs text-[#92400E]">
              <p className="font-medium">⚠️ Perhatian Pengakhiran Flock Aktif:</p>
              <p className="mt-1">
                Kandang ini memiliki flock aktif <strong>{kandang.activeFlock.name}</strong>. Memulai flock baru akan <strong>otomatis mengakhiri masa flock aktif saat ini</strong> pada tanggal mulai flock baru.
              </p>
            </div>

            <label
              htmlFor="confirm-end-active-flock"
              className="flex cursor-pointer items-start gap-2.5 rounded-[10px] border border-[#FECACA] bg-danger-soft p-3 text-xs text-danger"
            >
              <input
                id="confirm-end-active-flock"
                type="checkbox"
                checked={confirmEndActiveFlock}
                disabled={isPending}
                onChange={(event) => {
                  setConfirmEndActiveFlock(
                    event.target.checked,
                  );
                  if (error) setError("");
                }}
                className="mt-0.5 h-4 w-4 shrink-0 accent-danger"
              />
              <span>
                Saya mengonfirmasi untuk mengakhiri flock aktif (
                <strong>{kandang.activeFlock.name}</strong>) dan memulai batch baru.
              </span>
            </label>
          </div>
        ) : null}

        <Input
          id="flock-name"
          label="Nama / Batch Flock"
          value={name}
          placeholder="Flock A 2026"
          maxLength={100}
          disabled={isPending}
          onChange={(event) => {
            setName(event.target.value);
            if (error) setError("");
          }}
        />

        <Input
          id="flock-start-date"
          type="date"
          label="Tanggal Mulai"
          value={startDate}
          max={getJakartaDateString()}
          disabled={isPending}
          onChange={(event) => {
            setStartDate(
              event.target.value,
            );
            if (error) setError("");
          }}
        />

        <Input
          id="flock-initial-population"
          type="number"
          label="Populasi Awal"
          min={1}
          step={1}
          inputMode="numeric"
          value={initialPopulation}
          placeholder="5000"
          disabled={isPending}
          onChange={(event) => {
            setInitialPopulation(
              event.target.value,
            );
            if (error) setError("");
          }}
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
            disabled={
              isPending ||
              (!isEditing &&
                Boolean(kandang.activeFlock) &&
                !confirmEndActiveFlock)
            }
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