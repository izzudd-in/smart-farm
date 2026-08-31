"use client";

import {
  type FormEvent,
  useState,
  useTransition,
} from "react";

import {
  createKandang,
  updateKandang,
} from "@/features/farm/actions/farm";
import type {
  KandangSummary,
  OperatorOption,
} from "@/features/farm/types/farm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { FarmModal } from "./farm-modal";

type KandangFormDialogProps = {
  kandang?: KandangSummary;
  operators: OperatorOption[];
  onClose: () => void;
  onSuccess?: (message: string) => void;
};

export function KandangFormDialog({
  kandang,
  operators,
  onClose,
  onSuccess,
}: KandangFormDialogProps) {
  const isEditing = Boolean(kandang);

  const [code, setCode] = useState(
    kandang?.code ?? "",
  );

  const [name, setName] = useState(
    kandang?.name ?? "",
  );

  const [
    selectedOperatorIds,
    setSelectedOperatorIds,
  ] = useState<string[]>(
    kandang?.operators.map(
      (operator) => operator.id,
    ) ?? [],
  );

  const [error, setError] = useState("");
  const [isPending, startTransition] =
    useTransition();

  function toggleOperator(
    operatorId: string,
  ) {
    setSelectedOperatorIds((current) =>
      current.includes(operatorId)
        ? current.filter(
            (id) => id !== operatorId,
          )
        : [...current, operatorId],
    );
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!trimmedCode) {
      setError("Kode kandang wajib diisi.");
      return;
    }

    if (trimmedCode.length > 20) {
      setError("Kode kandang maksimal 20 karakter.");
      return;
    }

    if (/\s/.test(trimmedCode)) {
      setError("Kode kandang tidak boleh mengandung spasi.");
      return;
    }

    if (!/^[A-Z0-9_-]+$/.test(trimmedCode)) {
      setError(
        "Kode kandang hanya boleh berisi huruf, angka, tanda - atau _.",
      );
      return;
    }

    if (!trimmedName) {
      setError("Nama kandang wajib diisi.");
      return;
    }

    if (trimmedName.length > 100) {
      setError("Nama kandang maksimal 100 karakter.");
      return;
    }

    startTransition(async () => {
      const input = {
        code: trimmedCode,
        name: trimmedName,
        operatorIds: selectedOperatorIds,
      };

      const result =
        kandang
          ? await updateKandang(
              kandang.id,
              input,
            )
          : await createKandang(input);

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
          ? "Edit Kandang"
          : "Tambah Kandang"
      }
      description="Kelola identitas kandang dan operator yang bertugas."
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

        <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
          <Input
            id="kandang-code"
            label="Kode"
            value={code}
            placeholder="A"
            maxLength={20}
            disabled={isPending}
            onChange={(event) => {
              setCode(event.target.value);
              if (error) setError("");
            }}
          />

          <Input
            id="kandang-name"
            label="Nama Kandang"
            value={name}
            placeholder="Kandang A"
            maxLength={100}
            disabled={isPending}
            onChange={(event) => {
              setName(event.target.value);
              if (error) setError("");
            }}
          />
        </div>

        <fieldset>
          <legend className="text-[13px] font-medium text-foreground">
            Operator
          </legend>

          <div className="mt-2 space-y-2">
            {operators.length === 0 ? (
              <p className="rounded-[10px] border border-border bg-[#F9FAFB] p-3 text-sm text-muted">
                Belum ada Operator aktif.
              </p>
            ) : (
              operators.map((operator) => (
                <label
                  key={operator.id}
                  htmlFor={`operator-${operator.id}`}
                  className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-border p-3 hover:bg-[#F9FAFB]"
                >
                  <input
                    id={`operator-${operator.id}`}
                    type="checkbox"
                    checked={selectedOperatorIds.includes(
                      operator.id,
                    )}
                    disabled={isPending}
                    onChange={() =>
                      toggleOperator(
                        operator.id,
                      )
                    }
                    className="h-4 w-4 accent-primary"
                  />

                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">
                      {operator.name}
                    </span>

                    <span className="block truncate text-xs text-muted">
                      {operator.email}
                    </span>
                  </span>
                </label>
              ))
            )}
          </div>
        </fieldset>

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
                : "Tambah Kandang"}
          </Button>
        </div>
      </form>
    </FarmModal>
  );
}