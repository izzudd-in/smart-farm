import Link from "next/link";
import {
  ChevronRight,
  FileText,
  Package,
  RotateCcw,
  ShoppingCart,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  CustomerView,
  OrderListData,
  OrderView,
} from "@/features/sales/types/sales";

type OrderListProps = {
  data: OrderListData;
  customers: CustomerView[];
  onRepeatOrder?: (order: OrderView) => void;
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
  onRepeatOrder,
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
          {/* Mobile Card Layout (UX-016: Card layout for mobile screens) */}
          <div className="space-y-3 md:hidden">
            {data.orders.map(
              (order) => {
                const discountNum = Number(order.discountPerKg);
                return (
                  <Card
                    key={order.id}
                    className="min-w-0 p-4 transition-all hover:border-primary/30"
                  >
                    {/* Header: Customer Name & Date */}
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground text-sm">
                          {order.customerName}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {formatDate(order.orderedAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {onRepeatOrder ? (
                          <button
                            type="button"
                            onClick={() => onRepeatOrder(order)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-white px-2 text-xs font-medium text-foreground hover:bg-[#F9FAFB] transition-colors"
                            title="Ulangi order ini"
                          >
                            <RotateCcw className="h-3 w-3 text-muted" />
                            Ulangi
                          </button>
                        ) : null}

                        <Link
                          href={`/sales/orders/${order.id}`}
                          className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary-soft px-2.5 text-xs font-medium text-primary hover:bg-primary/15 transition-colors"
                        >
                          Detail
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>

                    {/* Order Metrics Grid */}
                    <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-[#F9FAFB] p-2.5 text-xs">
                      <div>
                        <span className="text-muted block text-[11px]">Jumlah:</span>
                        <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                          <Package className="h-3 w-3 text-primary shrink-0" />
                          {quantityFormatter.format(Number(order.quantityKg))} kg
                        </span>
                      </div>

                      <div>
                        <span className="text-muted block text-[11px]">Harga / kg:</span>
                        <span className="font-medium text-foreground block mt-0.5">
                          {currencyFormatter.format(Number(order.finalPricePerKg))}
                        </span>
                        {discountNum > 0 ? (
                          <span className="text-[10px] text-[#059669]">
                            (Disc: {currencyFormatter.format(discountNum)})
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Note if available */}
                    {order.note ? (
                      <div className="mt-2.5 flex items-start gap-1.5 text-[11px] text-muted">
                        <FileText className="h-3 w-3 shrink-0 mt-0.5 text-muted-light" />
                        <p className="line-clamp-1 italic">{order.note}</p>
                      </div>
                    ) : null}

                    {/* Footer: Total Price */}
                    <div className="mt-3 flex min-w-0 items-center justify-between border-t border-border pt-2.5">
                      <span className="text-xs font-medium text-muted">Total Transaksi:</span>
                      <span className="text-base font-bold text-primary">
                        {currencyFormatter.format(Number(order.totalPrice))}
                      </span>
                    </div>
                  </Card>
                );
              },
            )}
          </div>

          {/* Desktop Table Layout (UX-016: Structured table for desktop) */}
          <Card className="hidden overflow-hidden md:block">
            <div className="grid grid-cols-[minmax(0,1.2fr)_120px_100px_130px_150px_130px] items-center gap-4 border-b border-border bg-[#F9FAFB] px-4 py-3 text-xs font-semibold text-muted">
              <span>Customer</span>
              <span>Tanggal</span>
              <span className="text-right">Jumlah</span>
              <span className="text-right">Harga / kg</span>
              <span className="text-right">Total Transaksi</span>
              <span className="text-right">Aksi</span>
            </div>

            <div className="divide-y divide-border">
              {data.orders.map(
                (order) => {
                  const discountNum = Number(order.discountPerKg);
                  return (
                    <div
                      key={order.id}
                      className="grid min-w-0 grid-cols-[minmax(0,1.2fr)_120px_100px_130px_150px_130px] items-center gap-4 px-4 py-3 hover:bg-[#F9FAFB]/60 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="min-w-0 truncate text-sm font-medium text-foreground">
                          {order.customerName}
                        </p>
                        {order.note ? (
                          <p className="truncate text-xs text-muted-light mt-0.5">
                            {order.note}
                          </p>
                        ) : null}
                      </div>

                      <p className="text-sm text-muted">
                        {formatDate(order.orderedAt)}
                      </p>

                      <p className="text-right text-sm font-medium text-foreground">
                        {quantityFormatter.format(Number(order.quantityKg))} kg
                      </p>

                      <div className="text-right text-sm">
                        <p className="font-medium text-foreground">
                          {currencyFormatter.format(Number(order.finalPricePerKg))}
                        </p>
                        {discountNum > 0 ? (
                          <p className="text-[10px] text-[#059669]">
                            Disc: {currencyFormatter.format(discountNum)}
                          </p>
                        ) : null}
                      </div>

                      <p className="text-right text-sm font-bold text-foreground">
                        {currencyFormatter.format(Number(order.totalPrice))}
                      </p>

                      <div className="flex items-center justify-end gap-1.5">
                        {onRepeatOrder ? (
                          <button
                            type="button"
                            onClick={() => onRepeatOrder(order)}
                            className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted hover:text-foreground hover:bg-[#F3F4F6] transition-colors"
                            title="Ulangi order ini"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Ulangi
                          </button>
                        ) : null}

                        <Link
                          href={`/sales/orders/${order.id}`}
                          className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-primary hover:bg-primary-soft transition-colors"
                        >
                          Detail
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                },
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