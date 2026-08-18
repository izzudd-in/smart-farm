import Link from "next/link";
import {
  ChevronRight,
  ShoppingCart,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  CustomerView,
  OrderListData,
} from "@/features/sales/types/sales";

type OrderListProps = {
  data: OrderListData;
  customers: CustomerView[];
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
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    },
  ).format(
    new Date(
      `${value}T00:00:00.000Z`,
    ),
  );
}

export function OrderList({
  data,
  customers,
}: OrderListProps) {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <form
          method="get"
          className="grid gap-3 md:grid-cols-[170px_170px_1fr_auto]"
        >
          <input
            type="hidden"
            name="tab"
            value="order"
          />

          <div>
            <label
              htmlFor="order-from"
              className="mb-1.5 block text-xs font-medium text-muted"
            >
              Dari
            </label>

            <input
              id="order-from"
              name="from"
              type="date"
              max={
                data.filters.to
              }
              defaultValue={
                data.filters.from
              }
              className="h-10 w-full rounded-[10px] border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div>
            <label
              htmlFor="order-to"
              className="mb-1.5 block text-xs font-medium text-muted"
            >
              Sampai
            </label>

            <input
              id="order-to"
              name="to"
              type="date"
              defaultValue={
                data.filters.to
              }
              className="h-10 w-full rounded-[10px] border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div>
            <label
              htmlFor="order-customer-filter"
              className="mb-1.5 block text-xs font-medium text-muted"
            >
              Customer
            </label>

            <select
              id="order-customer-filter"
              name="customer"
              defaultValue={
                data.filters
                  .customerId
              }
              className="h-10 w-full rounded-[10px] border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              <option value="">
                Semua Customer
              </option>

              {customers.map(
                (customer) => (
                  <option
                    key={
                      customer.id
                    }
                    value={
                      customer.id
                    }
                  >
                    {customer.name}
                    {!customer.isActive
                      ? " (Nonaktif)"
                      : ""}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <Button
              type="submit"
              size="sm"
            >
              Terapkan
            </Button>

            <Link
              href="/sales?tab=order"
              className="inline-flex h-9 items-center justify-center rounded-[10px] border border-border bg-white px-3 text-xs font-medium text-foreground hover:bg-[#F9FAFB]"
            >
              Reset
            </Link>
          </div>
        </form>
      </Card>

      {data.orders.length === 0 ? (
        <Card className="p-8 text-center">
          <ShoppingCart className="mx-auto h-7 w-7 text-muted-light" />

          <p className="mt-3 font-medium text-foreground">
            Belum ada order sesuai filter.
          </p>

          <p className="mt-1 text-sm text-muted">
            Order baru akan muncul di sini.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {data.orders.map(
            (order) => (
              <Card
                key={order.id}
                className="min-w-0 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">
                      {order.customerName}
                    </p>

                    <p className="mt-1 text-xs text-muted">
                      {formatDate(
                        order.orderedAt,
                      )}
                    </p>
                  </div>

                  <Link
                    href={`/sales/orders/${order.id}`}
                    className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-medium text-primary-hover hover:bg-primary-soft"
                  >
                    Detail

                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="mt-4 flex items-end justify-between gap-4 border-t border-border pt-3">
                  <p className="text-sm font-medium text-muted">
                    {quantityFormatter.format(
                      Number(
                        order.quantityKg,
                      ),
                    )}{" "}
                    kg
                  </p>

                  <p className="text-lg font-semibold text-foreground">
                    {currencyFormatter.format(
                      Number(
                        order.totalPrice,
                      ),
                    )}
                  </p>
                </div>
              </Card>
            ),
          )}
        </div>
      )}

      {data.orders.length >= 100 ? (
        <p className="text-center text-xs text-muted">
          Menampilkan maksimal 100 transaksi terbaru sesuai filter.
        </p>
      ) : null}
    </div>
  );
}