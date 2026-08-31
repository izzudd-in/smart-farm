"use client";

import {
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Search,
  Store,
  Tags,
  Users,
  X,
} from "lucide-react";

import { setCustomerActive } from "@/features/sales/actions/sales";
import type {
  CustomerView,
  OrderListData,
  SalesPageData,
  SalesTab,
} from "@/features/sales/types/sales";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";

import { CustomerFormDialog } from "./customer-form-dialog";
import { EggPriceFormDialog } from "./egg-price-form-dialog";
import { OrderFormDialog } from "./order-form-dialog";
import { OrderList } from "./order-list";

type SalesManagementProps = {
  data: SalesPageData;
  orders: OrderListData;
  initialTab: SalesTab;
};

type FeedbackState = {
  type: "success" | "error";
  message: string;
} | null;

const currencyFormatter =
  new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 2,
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

function formatDateTime(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    },
  ).format(
    new Date(value),
  );
}

export function SalesManagement({
  data,
  orders,
  initialTab,
}: SalesManagementProps) {
  const router = useRouter();

  const [tab, setTab] =
    useState<SalesTab>(
      initialTab,
    );

  const [
    customerDialog,
    setCustomerDialog,
  ] = useState<
    CustomerView | "create" | null
  >(null);

  const [
    confirmDeactivateCustomer,
    setConfirmDeactivateCustomer,
  ] = useState<CustomerView | null>(null);

  const [
    priceDialog,
    setPriceDialog,
  ] = useState(false);

  const [
    orderDialog,
    setOrderDialog,
  ] = useState(false);

  const [
    repeatOrderData,
    setRepeatOrderData,
  ] = useState<{
    customerId: string;
    quantityKg: string;
    note?: string;
  } | null>(null);

  const [
    feedback,
    setFeedback,
  ] = useState<FeedbackState>(null);

  const [
    pendingId,
    setPendingId,
  ] = useState<
    string | null
  >(null);

  const [customerSearch, setCustomerSearch] = useState("");
  const [customerStatusFilter, setCustomerStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const activeCustomers =
    data.customers.filter(
      (customer) =>
        customer.isActive,
    );

  const inactiveCustomers =
    data.customers.filter(
      (customer) =>
        !customer.isActive,
    );

  const filteredCustomers = data.customers.filter((customer) => {
    if (customerStatusFilter === "active" && !customer.isActive) {
      return false;
    }
    if (customerStatusFilter === "inactive" && customer.isActive) {
      return false;
    }
    if (customerSearch.trim()) {
      const q = customerSearch.toLowerCase();
      const matchName = customer.name.toLowerCase().includes(q);
      const matchPhone = customer.phone?.toLowerCase().includes(q) ?? false;
      const matchAddress = customer.address?.toLowerCase().includes(q) ?? false;
      return matchName || matchPhone || matchAddress;
    }
    return true;
  });

  function toggleCustomer(
    customer: CustomerView,
  ) {
    setFeedback(null);
    setPendingId(
      customer.id,
    );

    startTransition(async () => {
      const result =
        await setCustomerActive(
          customer.id,
          !customer.isActive,
        );

      setPendingId(null);

      if (!result.success) {
        setFeedback({
          type: "error",
          message: result.error,
        });
        return;
      }

      setFeedback({
        type: "success",
        message: result.message,
      });
      router.refresh();
    });
  }

  function handlePrimaryAction() {
    setFeedback(null);
    if (tab === "order") {
      setRepeatOrderData(null);
      setOrderDialog(true);
      return;
    }

    if (tab === "customer") {
      setCustomerDialog(
        "create",
      );
      return;
    }

    setPriceDialog(true);
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Penjualan
            </h1>

            <p className="mt-1 text-sm text-muted">
              Order, customer, dan riwayat harga telur.
            </p>
          </div>

          <Button
            className="w-full sm:w-auto"
            onClick={
              handlePrimaryAction
            }
          >
            <Plus className="h-4 w-4" />

            {tab === "order"
              ? "Order Baru"
              : tab ===
                  "customer"
                ? "Tambah Customer"
                : "Update Harga"}
          </Button>
        </div>

        {feedback ? (
          <div
            role={
              feedback.type === "error"
                ? "alert"
                : "status"
            }
            className={[
              "flex items-center justify-between rounded-[10px] border p-4 text-sm",
              feedback.type === "error"
                ? "border-[#FECACA] bg-danger-soft text-danger"
                : "border-[#BBF7D0] bg-[#ECFDF5] text-[#065F46]",
            ].join(" ")}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === "error" ? (
                <AlertCircle className="h-4 w-4 shrink-0 text-danger" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#10B981]" />
              )}
              <span>{feedback.message}</span>
            </div>

            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-muted hover:text-foreground"
              aria-label="Tutup notifikasi"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        <div className="flex overflow-x-auto border-b border-border">
          <button
            type="button"
            onClick={() => {
              setFeedback(null);
              setTab("order");
            }}
            className={[
              "shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              tab === "order"
                ? "border-primary text-primary-hover"
                : "border-transparent text-muted hover:text-foreground",
            ].join(" ")}
          >
            Order
          </button>

          <button
            type="button"
            onClick={() => {
              setFeedback(null);
              setTab("customer");
            }}
            className={[
              "shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              tab === "customer"
                ? "border-primary text-primary-hover"
                : "border-transparent text-muted hover:text-foreground",
            ].join(" ")}
          >
            Customer ({data.customers.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setFeedback(null);
              setTab("price");
            }}
            className={[
              "shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              tab === "price"
                ? "border-primary text-primary-hover"
                : "border-transparent text-muted hover:text-foreground",
            ].join(" ")}
          >
            Harga Telur
          </button>
        </div>

        {tab === "order" ? (
          <OrderList
            data={orders}
            customers={
              data.customers
            }
            onRepeatOrder={(order) => {
              setFeedback(null);
              setRepeatOrderData({
                customerId:
                  order.customerId,
                quantityKg:
                  order.quantityKg,
                note:
                  order.note ??
                  "",
              });
              setOrderDialog(
                true,
              );
            }}
          />
        ) : tab ===
          "customer" ? (
          <div className="space-y-4">
            {/* Customer Stats */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted">Total Customer</p>
                    <p className="text-xl font-semibold text-foreground">
                      {data.customers.length}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#ECFDF5] text-[#10B981]">
                    <Store className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted">Customer Aktif</p>
                    <p className="text-xl font-semibold text-foreground">
                      {activeCustomers.length}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F3F4F6] text-muted">
                    <PowerOff className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted">Customer Nonaktif</p>
                    <p className="text-xl font-semibold text-foreground">
                      {inactiveCustomers.length}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Filter and Search Bar */}
            {data.customers.length > 0 ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <Input
                    placeholder="Cari nama, nomor, alamat..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setCustomerStatusFilter("all")}
                    className={[
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      customerStatusFilter === "all"
                        ? "bg-primary text-white"
                        : "text-muted hover:text-foreground",
                    ].join(" ")}
                  >
                    Semua ({data.customers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerStatusFilter("active")}
                    className={[
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      customerStatusFilter === "active"
                        ? "bg-primary text-white"
                        : "text-muted hover:text-foreground",
                    ].join(" ")}
                  >
                    Aktif ({activeCustomers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerStatusFilter("inactive")}
                    className={[
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      customerStatusFilter === "inactive"
                        ? "bg-primary text-white"
                        : "text-muted hover:text-foreground",
                    ].join(" ")}
                  >
                    Nonaktif ({inactiveCustomers.length})
                  </button>
                </div>
              </div>
            ) : null}

            {/* Customer List / Cards */}
            {data.customers.length === 0 ? (
              <Card className="p-8 text-center">
                <Store className="mx-auto h-8 w-8 text-muted-light" />
                <p className="mt-3 font-medium text-foreground">
                  Belum ada customer terdaftar.
                </p>
                <p className="mt-1 text-xs text-muted">
                  Tambahkan customer baru untuk mulai mencatat pesanan penjualan telur.
                </p>
                <Button
                  className="mt-4 mx-auto"
                  onClick={() => setCustomerDialog("create")}
                >
                  <Plus className="h-4 w-4" />
                  Tambah Customer
                </Button>
              </Card>
            ) : filteredCustomers.length === 0 ? (
              <Card className="p-8 text-center text-sm text-muted">
                Tidak ada customer yang sesuai dengan kriteria pencarian atau filter.
              </Card>
            ) : (
              <div className="grid min-w-0 gap-3 xl:grid-cols-2">
                {filteredCustomers.map((customer) => (
                  <Card
                    key={customer.id}
                    className="min-w-0 p-4 transition-all hover:border-primary/30"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-foreground">
                            {customer.name}
                          </p>

                          <Badge
                            variant={
                              customer.isActive
                                ? "success"
                                : "neutral"
                            }
                          >
                            {customer.isActive
                              ? "Aktif"
                              : "Nonaktif"}
                          </Badge>
                        </div>

                        <p className="mt-2 text-sm font-medium text-foreground">
                          Diskon{" "}
                          <span className="text-primary font-semibold">
                            {currencyFormatter.format(
                              Number(
                                customer.discountPerKg,
                              ),
                            )}
                          </span>
                          /kg
                        </p>

                        {customer.phone ? (
                          <p className="mt-1 text-sm text-muted">
                            📞 {customer.phone}
                          </p>
                        ) : null}

                        {customer.address ? (
                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">
                            📍 {customer.address}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        {customer.isActive ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setFeedback(null);
                              setRepeatOrderData({
                                customerId:
                                  customer.id,
                                quantityKg: "",
                                note: "",
                              });
                              setOrderDialog(true);
                            }}
                            className="text-primary hover:text-primary-hover"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Order
                          </Button>
                        ) : null}

                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setFeedback(null);
                            setCustomerDialog(
                              customer,
                            );
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>

                        <Button
                          size="sm"
                          variant={
                            customer.isActive
                              ? "destructive"
                              : "secondary"
                          }
                          disabled={
                            isPending &&
                            pendingId ===
                              customer.id
                          }
                          onClick={() => {
                            if (customer.isActive) {
                              setConfirmDeactivateCustomer(customer);
                            } else {
                              toggleCustomer(customer);
                            }
                          }}
                        >
                          {customer.isActive ? (
                            <PowerOff className="h-3.5 w-3.5" />
                          ) : (
                            <Power className="h-3.5 w-3.5" />
                          )}

                          {isPending &&
                          pendingId ===
                            customer.id
                            ? "Memproses..."
                            : customer.isActive
                              ? "Nonaktifkan"
                              : "Aktifkan"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Tags className="h-4 w-4" />
                    Harga Aktif
                  </div>

                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {data.activePrice
                      ? `${currencyFormatter.format(
                          Number(
                            data
                              .activePrice
                              .pricePerKg,
                          ),
                        )}/kg`
                      : "Belum ada harga"}
                  </p>

                  {data.activePrice ? (
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <span>
                        Berlaku sejak: {formatDate(
                          data.activePrice.effectiveAt,
                        )}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <Clock className="h-3.5 w-3.5 text-muted" />
                        Terakhir diperbarui: {formatDateTime(
                          data.activePrice.createdAt,
                        )} WIB
                      </span>
                    </div>
                  ) : null}
                </div>

                <Button
                  onClick={() => {
                    setFeedback(null);
                    setPriceDialog(
                      true,
                    );
                  }}
                >
                  Update Harga
                </Button>
              </div>
            </Card>

            <div>
              <h2 className="mb-3 font-semibold text-foreground">
                Riwayat Harga
              </h2>

              {data.priceHistory.length ===
              0 ? (
                <Card className="p-8 text-center text-sm text-muted">
                  Belum ada riwayat harga.
                </Card>
              ) : (
                <Card className="divide-y divide-border overflow-hidden">
                  {data.priceHistory.map(
                    (price) => (
                      <div
                        key={
                          price.id
                        }
                        className="flex items-center justify-between gap-4 p-4"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-foreground">
                              Berlaku: {formatDate(
                                price.effectiveAt,
                              )}
                            </p>

                            {price.effectiveAt >
                            data.asOfDate ? (
                              <Badge
                                variant="neutral"
                                className="text-[10px] py-0 px-1.5"
                              >
                                Akan datang
                              </Badge>
                            ) : null}
                          </div>

                          <p className="mt-0.5 text-xs text-muted">
                            Dicatat: {formatDateTime(
                              price.createdAt,
                            )} WIB
                          </p>
                        </div>

                        <p className="shrink-0 font-semibold text-foreground">
                          {currencyFormatter.format(
                            Number(
                              price.pricePerKg,
                            ),
                          )}
                          /kg
                        </p>
                      </div>
                    ),
                  )}
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {orderDialog ? (
        <OrderFormDialog
          customers={
            activeCustomers
          }
          defaultOrderedAt={
            data.asOfDate
          }
          initialData={
            repeatOrderData
          }
          onSuccess={(message) => {
            setFeedback({
              type: "success",
              message,
            });
          }}
          onClose={() => {
            setOrderDialog(
              false,
            );
            setRepeatOrderData(
              null,
            );
          }}
        />
      ) : null}

      {customerDialog ? (
        <CustomerFormDialog
          customer={
            customerDialog ===
            "create"
              ? undefined
              : customerDialog
          }
          onSuccess={(message) => {
            setFeedback({
              type: "success",
              message,
            });
          }}
          onClose={() =>
            setCustomerDialog(
              null,
            )
          }
        />
      ) : null}

      {confirmDeactivateCustomer ? (
        <ConfirmDialog
          title="Konfirmasi Nonaktifkan Customer"
          confirmText="Ya, Nonaktifkan"
          cancelText="Batal"
          variant="destructive"
          isLoading={
            isPending &&
            pendingId ===
              confirmDeactivateCustomer.id
          }
          onConfirm={() => {
            const target =
              confirmDeactivateCustomer;
            setConfirmDeactivateCustomer(
              null,
            );
            toggleCustomer(target);
          }}
          onClose={() =>
            setConfirmDeactivateCustomer(
              null,
            )
          }
          description={
            <div className="space-y-2">
              <p className="text-foreground">
                Apakah Anda yakin ingin menonaktifkan customer{" "}
                <strong>
                  {confirmDeactivateCustomer.name}
                </strong>
                ?
              </p>
              <p className="text-xs text-muted">
                Customer yang dinonaktifkan tidak akan muncul pada pilihan saat
                membuat order baru. Riwayat transaksi sebelumnya tetap
                tersimpan.
              </p>
            </div>
          }
        />
      ) : null}

      {priceDialog ? (
        <EggPriceFormDialog
          activePrice={data.activePrice}
          latestPrice={
            data.priceHistory[0] ??
            data.activePrice
          }
          onSuccess={(message) => {
            setFeedback({
              type: "success",
              message,
            });
          }}
          onClose={() =>
            setPriceDialog(
              false,
            )
          }
        />
      ) : null}
    </>
  );
}