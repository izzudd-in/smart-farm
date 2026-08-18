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

const integerFormatter =
  new Intl.NumberFormat(
    "id-ID",
    {
      maximumFractionDigits: 0,
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

type SummaryCardProps = {
  label: string;
  value: string;
};

function SummaryCard({
  label,
  value,
}: SummaryCardProps) {
  return (
    <Card className="min-w-0 p-4">
      <p className="text-xs font-medium text-muted">
        {label}
      </p>

      <p className="mt-1 truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
        {value}
      </p>
    </Card>
  );
}

export function OrderList({
  data,
  customers,
}: OrderListProps) {
  const {
    summary,
    filters,
  } = data;

  return (
    <div className="min-w-0 space-y-4">
      <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          label="Total Penjualan"
          value={
            currencyFormatter.format(
              Number(
                summary.totalSales,
              ),
            )
          }
        />

        <SummaryCard
          label="Total Kg Terjual"
          value={`${quantityFormatter.format(
            Number(
              summary.totalQuantityKg,
            ),
          )} kg`}
        />

        <SummaryCard
          label="Jumlah Order"
          value={
            integerFormatter.format(
              summary.orderCount,
            )
          }
        />

        <SummaryCard
          label="Customer Aktif"
          value={
            integerFormatter.format(
              summary.activeCustomerCount,
            )
          }
        />
      </div>

      <Card className="min-w-0 p-4">
        <form
          method="get"
          className="grid min-w-0 gap-3 md:grid-cols-[170px_170px_minmax(0,1fr)_auto]"
        >
          <input
            type="hidden"
            name="tab"
            value="order"
          />

          <div className="min-w-0">
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
              max={filters.to}
              defaultValue={
                filters.from
              }
              className="h-10 w-full min-w-0 rounded-[10px] border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div className="min-w-0">
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
              min={filters.from}
              defaultValue={
                filters.to
              }
              className="h-10 w-full min-w-0 rounded-[10px] border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div className="min-w-0">
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
                filters.customerId
              }
              className="h-10 w-full min-w-0 rounded-[10px] border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
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

          <div className="flex min-w-0 items-end gap-2">
            <Button
              type="submit"
              size="sm"
            >
              Terapkan
            </Button>

            <Link
              href="/sales?tab=order"
              className="inline-flex h-9 items-center justify-center rounded-[10px] border border-border bg-white px-3 text-xs font-medium text-foreground transition-colors hover:bg-[#F9FAFB]"
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
            Ubah filter atau buat order baru.
          </p>
        </Card>
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            {data.orders.map(
              (order) => (
                <Card
                  key={order.id}
                  className="min-w-0 p-4"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
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

                  <div className="mt-4 flex min-w-0 items-end justify-between gap-3 border-t border-border pt-3">
                    <p className="shrink-0 text-sm font-medium text-muted">
                      {quantityFormatter.format(
                        Number(
                          order.quantityKg,
                        ),
                      )}{" "}
                      kg
                    </p>

                    <p className="min-w-0 truncate text-right text-base font-semibold text-foreground">
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

          <Card className="hidden overflow-hidden md:block">
            <div className="grid grid-cols-[minmax(0,1fr)_140px_130px_180px_80px] items-center gap-4 border-b border-border bg-[#F9FAFB] px-4 py-2.5 text-xs font-medium text-muted">
              <span>
                Customer
              </span>

              <span>
                Tanggal
              </span>

              <span className="text-right">
                Jumlah
              </span>

              <span className="text-right">
                Total
              </span>

              <span />
            </div>

            <div className="divide-y divide-border">
              {data.orders.map(
                (order) => (
                  <div
                    key={order.id}
                    className="grid min-w-0 grid-cols-[minmax(0,1fr)_140px_130px_180px_80px] items-center gap-4 px-4 py-3"
                  >
                    <p className="min-w-0 truncate text-sm font-medium text-foreground">
                      {order.customerName}
                    </p>

                    <p className="text-sm text-muted">
                      {formatDate(
                        order.orderedAt,
                      )}
                    </p>

                    <p className="text-right text-sm text-foreground">
                      {quantityFormatter.format(
                        Number(
                          order.quantityKg,
                        ),
                      )}{" "}
                      kg
                    </p>

                    <p className="text-right text-sm font-semibold text-foreground">
                      {currencyFormatter.format(
                        Number(
                          order.totalPrice,
                        ),
                      )}
                    </p>

                    <Link
                      href={`/sales/orders/${order.id}`}
                      className="inline-flex h-8 items-center justify-end gap-1 text-xs font-medium text-primary-hover hover:underline"
                    >
                      Detail
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ),
              )}
            </div>
          </Card>
        </>
      )}

      {data.orders.length >= 100 ? (
        <p className="text-center text-xs text-muted">
          History menampilkan maksimal 100 order terbaru. Summary tetap menghitung seluruh order sesuai filter.
        </p>
      ) : null}
    </div>
  );
}