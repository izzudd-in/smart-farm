"use client";

import {
  type FormEvent,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

import {
  createCustomer,
  updateCustomer,
} from "@/features/sales/actions/sales";
import type { CustomerView } from "@/features/sales/types/sales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { SalesModal } from "./sales-modal";

type CustomerFormDialogProps = {
  customer?: CustomerView;
  onClose: () => void;
};

export function CustomerFormDialog({
  customer,
  onClose,
}: CustomerFormDialogProps) {
  const router = useRouter();

  const [name, setName] =
    useState(
      customer?.name ?? "",
    );

  const [phone, setPhone] =
    useState(
      customer?.phone ?? "",
    );

  const [address, setAddress] =
    useState(
      customer?.address ?? "",
    );

  const [
    discountPerKg,
    setDiscountPerKg,
  ] = useState(
    customer?.discountPerKg ??
      "0",
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
        phone,
        address,
        discountPerKg,
      };

      const result = customer
        ? await updateCustomer(
            customer.id,
            input,
          )
        : await createCustomer(
            input,
          );

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
      title={
        customer
          ? "Edit Customer"
          : "Tambah Customer"
      }
      description="Kelola identitas customer dan diskon per kilogram."
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
          label="Nama Customer"
          placeholder="Toko Berkah"
          value={name}
          disabled={isPending}
          onChange={(event) =>
            setName(
              event.target.value,
            )
          }
        />

        <Input
          type="tel"
          label="Nomor Telepon"
          placeholder="0812..."
          value={phone}
          disabled={isPending}
          onChange={(event) =>
            setPhone(
              event.target.value,
            )
          }
        />

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="customer-address"
            className="text-[13px] font-medium text-foreground"
          >
            Alamat
          </label>

          <textarea
            id="customer-address"
            rows={3}
            maxLength={500}
            value={address}
            disabled={isPending}
            placeholder="Opsional"
            onChange={(event) =>
              setAddress(
                event.target.value,
              )
            }
            className="w-full resize-y rounded-[10px] border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-light focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-[#F3F4F6]"
          />
        </div>

        <Input
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          label="Diskon / kg"
          placeholder="0"
          value={discountPerKg}
          disabled={isPending}
          onChange={(event) =>
            setDiscountPerKg(
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
              : "Simpan"}
          </Button>
        </div>
      </form>
    </SalesModal>
  );
}