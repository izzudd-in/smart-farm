"use client";

import {
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Plus,
  Power,
  PowerOff,
  Store,
  Tags,
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

import { CustomerFormDialog } from "./customer-form-dialog";
import { EggPriceFormDialog } from "./egg-price-form-dialog";
import { OrderFormDialog } from "./order-form-dialog";
import { OrderList } from "./order-list";

type SalesManagementProps = {
  data: SalesPageData;
  orders: OrderListData;
  initialTab: SalesTab;
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
    priceDialog,
    setPriceDialog,
  ] = useState(false);

  const [
    orderDialog,
    setOrderDialog,
  ] = useState(false);

  const [
    actionError,
    setActionError,
  ] = useState("");

  const [
    pendingId,
    setPendingId,
  ] = useState<
    string | null
  >(null);

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const activeCustomers =
    data.customers.filter(
      (customer) =>
        customer.isActive,
    );

  function toggleCustomer(
    customer: CustomerView,
  ) {
    setActionError("");
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
        setActionError(
          result.error,
        );
        return;
      }

      router.refresh();
    });
  }

  function handlePrimaryAction() {
    if (tab === "order") {
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

        {actionError ? (
          <div
            role="alert"
            className="rounded-[10px] border border-[#FECACA] bg-danger-soft p-3 text-sm text-danger"
          >
            {actionError}
          </div>
        ) : null}

        <div className="flex overflow-x-auto border-b border-border">
          <button
            type="button"
            onClick={() =>
              setTab("order")
            }
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
            onClick={() =>
              setTab(
                "customer",
              )
            }
            className={[
              "shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              tab === "customer"
                ? "border-primary text-primary-hover"
                : "border-transparent text-muted hover:text-foreground",
            ].join(" ")}
          >
            Customer
          </button>

          <button
            type="button"
            onClick={() =>
              setTab("price")
            }
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
          />
        ) : tab ===
          "customer" ? (
          data.customers.length ===
          0 ? (
            <Card className="p-8 text-center">
              <Store className="mx-auto h-7 w-7 text-muted-light" />

              <p className="mt-3 font-medium text-foreground">
                Belum ada customer.
              </p>
            </Card>
          ) : (
            <div className="grid min-w-0 gap-3 xl:grid-cols-2">
              {data.customers.map(
                (customer) => (
                  <Card
                    key={
                      customer.id
                    }
                    className="min-w-0 p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-foreground">
                            {
                              customer.name
                            }
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
                          {currencyFormatter.format(
                            Number(
                              customer.discountPerKg,
                            ),
                          )}
                          /kg
                        </p>

                        {customer.phone ? (
                          <p className="mt-1 text-sm text-muted">
                            {
                              customer.phone
                            }
                          </p>
                        ) : null}

                        {customer.address ? (
                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">
                            {
                              customer.address
                            }
                          </p>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            setCustomerDialog(
                              customer,
                            )
                          }
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
                          onClick={() =>
                            toggleCustomer(
                              customer,
                            )
                          }
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
                ),
              )}
            </div>
          )
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
                    <p className="mt-1 text-xs text-muted">
                      Berlaku sejak{" "}
                      {formatDate(
                        data
                          .activePrice
                          .effectiveAt,
                      )}
                    </p>
                  ) : null}
                </div>

                <Button
                  onClick={() =>
                    setPriceDialog(
                      true,
                    )
                  }
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
                          <p className="text-sm font-medium text-foreground">
                            {formatDate(
                              price.effectiveAt,
                            )}
                          </p>

                          {price.effectiveAt >
                          data.asOfDate ? (
                            <p className="mt-1 text-xs text-muted">
                              Akan datang
                            </p>
                          ) : null}
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
          onClose={() =>
            setOrderDialog(
              false,
            )
          }
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
          onClose={() =>
            setCustomerDialog(
              null,
            )
          }
        />
      ) : null}

      {priceDialog ? (
        <EggPriceFormDialog
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