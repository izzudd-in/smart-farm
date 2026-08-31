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
  onSuccess?: (message: string) => void;
};

export function CustomerFormDialog({
  customer,
  onClose,
  onSuccess,
}: CustomerFormDialogProps) {
  const router = useRouter();
  const isEditing = Boolean(customer);

  const [name, setName] = useState(
    customer?.name ?? "",
  );

  const [phone, setPhone] = useState(
    customer?.phone ?? "",
  );

  const [address, setAddress] = useState(
    customer?.address ?? "",
  );

  const [discountPerKg, setDiscountPerKg] = useState(
    customer?.discountPerKg ?? "0",
  );

  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedAddress = address.trim();
    const normalizedDiscount = discountPerKg.trim().replace(",", ".");

    if (!trimmedName) {
      setError("Nama customer wajib diisi.");
      return;
    }

    if (trimmedName.length > 100) {
      setError("Nama customer maksimal 100 karakter.");
      return;
    }

    if (trimmedPhone) {
      if (trimmedPhone.length > 30) {
        setError("Nomor telepon maksimal 30 karakter.");
        return;
      }
      if (!/^[0-9+\-\s()]+$/.test(trimmedPhone)) {
        setError("Nomor telepon hanya boleh berisi angka dan simbol (+, -, ()).");
        return;
      }
    }

    if (trimmedAddress && trimmedAddress.length > 500) {
      setError("Alamat maksimal 500 karakter.");
      return;
    }

    if (
      normalizedDiscount &&
      (!/^\d+(\.\d{1,2})?$/.test(normalizedDiscount) || Number(normalizedDiscount) < 0)
    ) {
      setError("Diskon/kg harus berupa angka 0 atau lebih dengan maksimal 2 desimal.");
      return;
    }

    startTransition(async () => {
      const input = {
        name: trimmedName,
        phone: trimmedPhone,
        address: trimmedAddress,
        discountPerKg: normalizedDiscount || "0",
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
      title={
        isEditing
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
          id="customer-name"
          label="Nama Customer"
          placeholder="Toko Berkah"
          value={name}
          maxLength={100}
          disabled={isPending}
          onChange={(event) => {
            setName(event.target.value);
            if (error) setError("");
          }}
        />

        <Input
          id="customer-phone"
          type="tel"
          label="Nomor Telepon"
          placeholder="08123456789 (Opsional)"
          value={phone}
          maxLength={30}
          disabled={isPending}
          onChange={(event) => {
            setPhone(event.target.value);
            if (error) setError("");
          }}
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
            placeholder="Opsional (maksimal 500 karakter)"
            onChange={(event) => {
              setAddress(event.target.value);
              if (error) setError("");
            }}
            className="w-full resize-y rounded-[10px] border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-light focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-[#F3F4F6]"
          />
        </div>

        <Input
          id="customer-discount"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          label="Diskon / kg (Rp)"
          placeholder="0"
          value={discountPerKg}
          disabled={isPending}
          onChange={(event) => {
            setDiscountPerKg(event.target.value);
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
            disabled={isPending}
          >
            {isPending
              ? "Menyimpan..."
              : isEditing
                ? "Simpan Perubahan"
                : "Tambah Customer"}
          </Button>
        </div>
      </form>
    </SalesModal>
  );
}