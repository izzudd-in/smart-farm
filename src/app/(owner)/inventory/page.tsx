import Link from "next/link";

import { Button } from "@/components/ui/button";

import { EggInventory } from "@/features/inventory/components/egg-inventory";
import { FeedInventory } from "@/features/inventory/components/feed-inventory";

import {
  getEggInventoryData,
} from "@/features/inventory/queries/get-egg-stock";

import {
  getFeedInventoryData,
} from "@/features/inventory/queries/get-feed-stock";

import {
  formatInventoryDate,
  parseInventoryAsOfDate,
} from "@/features/inventory/utils/inventory";

type InventoryTab =
  | "egg"
  | "feed";

type InventoryPageProps = {
  searchParams: Promise<{
    tab?:
      | string
      | string[];

    date?:
      | string
      | string[];
  }>;
};

function firstValue(
  value:
    | string
    | string[]
    | undefined,
): string | undefined {
  return Array.isArray(
    value,
  )
    ? value[0]
    : value;
}

function inventoryUrl(
  tab: InventoryTab,
  date: string,
): string {
  return `/inventory?tab=${tab}&date=${encodeURIComponent(
    date,
  )}`;
}

export default async function InventoryPage({
  searchParams,
}: InventoryPageProps) {
  const params =
    await searchParams;

  const tab: InventoryTab =
    firstValue(
      params.tab,
    ) === "feed"
      ? "feed"
      : "egg";

  const asOf =
    parseInventoryAsOfDate(
      firstValue(
        params.date,
      ),
    );

  return (
    <div className="min-w-0 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Inventory
        </h1>

        <p className="mt-1 text-sm text-muted">
          Stok berbasis movement dari transaksi asli, tanpa angka stok yang diedit langsung.
        </p>
      </div>

      <div className="flex min-w-0 border-b border-border">
        <Link
          href={inventoryUrl(
            "egg",
            asOf.dateString,
          )}
          aria-current={
            tab === "egg"
              ? "page"
              : undefined
          }
          className={[
            "min-w-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
            tab === "egg"
              ? "border-primary text-primary-hover"
              : "border-transparent text-muted hover:text-foreground",
          ].join(" ")}
        >
          Stok Telur
        </Link>

        <Link
          href={inventoryUrl(
            "feed",
            asOf.dateString,
          )}
          aria-current={
            tab === "feed"
              ? "page"
              : undefined
          }
          className={[
            "min-w-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
            tab === "feed"
              ? "border-primary text-primary-hover"
              : "border-transparent text-muted hover:text-foreground",
          ].join(" ")}
        >
          Stok Pakan
        </Link>
      </div>

      <div className="flex min-w-0 flex-col gap-3 rounded-[10px] border border-border bg-white p-3 sm:flex-row sm:items-end sm:justify-between">
        <form
          method="get"
          className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end"
        >
          <input
            type="hidden"
            name="tab"
            value={tab}
          />

          <div className="min-w-0">
            <label
              htmlFor="inventory-date"
              className="mb-1.5 block text-xs font-medium text-muted"
            >
              Stok per tanggal
            </label>

            <input
              id="inventory-date"
              name="date"
              type="date"
              max={asOf.today}
              defaultValue={
                asOf.dateString
              }
              className="h-10 w-full min-w-0 rounded-[10px] border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 sm:w-[180px]"
            />
          </div>

          <Button
            type="submit"
            size="sm"
          >
            Terapkan
          </Button>
        </form>

        <div className="flex min-w-0 items-center justify-between gap-3 sm:justify-end">
          <p className="truncate text-xs text-muted">
            Data sampai{" "}
            {formatInventoryDate(
              asOf.dateString,
            )}
          </p>

          {asOf.dateString !==
          asOf.today ? (
            <Link
              href={inventoryUrl(
                tab,
                asOf.today,
              )}
              className="shrink-0 text-xs font-medium text-primary-hover hover:underline"
            >
              Hari Ini
            </Link>
          ) : null}
        </div>
      </div>

      {tab === "feed" ? (
        <FeedInventory
          data={
            await getFeedInventoryData(
              asOf.date,
            )
          }
        />
      ) : (
        <EggInventory
          data={
            await getEggInventoryData(
              asOf.date,
            )
          }
        />
      )}
    </div>
  );
}