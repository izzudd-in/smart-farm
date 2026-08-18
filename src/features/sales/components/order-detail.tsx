import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ShoppingCart,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import type { OrderView } from "@/features/sales/types/sales";

type OrderDetailProps = {
  order: OrderView;
};

const currencyFormatter =
  new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 2,
    },
  );

const quantityFormatter =
  new Intl.NumberFormat(
    "id-ID",
    {
      maximumFractionDigits: 3,
    },
  );

function formatDate(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    },
  ).format(
    new Date(
      `${value}T00:00:00.000Z`,
    ),
  );
}

function money(
  value: string,
): string {
  return currencyFormatter.format(
    Number(value),
  );
}

function DetailItem({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <p className="text-sm text-muted">
        {label}
      </p>

      <p
        className={[
          "text-right",
          emphasized
            ? "text-lg font-semibold text-foreground"
            : "text-sm font-medium text-foreground",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

export function OrderDetail({
  order,
}: OrderDetailProps) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <Link
        href="/sales?tab=order"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Penjualan
      </Link>

      <Card className="overflow-hidden">
        <div className="border-b border-border p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-primary-soft text-primary-hover">
              <ShoppingCart className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-foreground">
                {order.customerName}
              </h1>

              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                <CalendarDays className="h-4 w-4" />

                {formatDate(
                  order.orderedAt,
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <DetailItem
            label="Jumlah"
            value={`${quantityFormatter.format(
              Number(
                order.quantityKg,
              ),
            )} kg`}
          />

          <DetailItem
            label="Harga Dasar"
            value={`${money(
              order.basePricePerKg,
            )}/kg`}
          />

          <DetailItem
            label="Diskon"
            value={`${money(
              order.discountPerKg,
            )}/kg`}
          />

          <DetailItem
            label="Harga Final"
            value={`${money(
              order.finalPricePerKg,
            )}/kg`}
          />

          <DetailItem
            label="Total"
            value={money(
              order.totalPrice,
            )}
            emphasized
          />

          {order.note ? (
            <div className="pt-4">
              <p className="text-xs text-muted">
                Catatan
              </p>

              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                {order.note}
              </p>
            </div>
          ) : null}
        </div>
      </Card>

      <p className="text-center text-xs text-muted">
        Detail ini menggunakan snapshot harga dan customer saat transaksi dibuat.
      </p>
    </div>
  );
}