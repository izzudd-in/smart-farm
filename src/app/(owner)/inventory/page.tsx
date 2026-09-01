import Link from "next/link";
import { Egg, Wheat } from "lucide-react";

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
  today?: string,
): string {
  const isToday = !today || date === today;
  if (tab === "egg") {
    return isToday ? "/inventory" : `/inventory?date=${encodeURIComponent(date)}`;
  }
  return isToday
    ? `/inventory?tab=feed`
    : `/inventory?tab=feed&date=${encodeURIComponent(date)}`;
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

      <div className="flex min-w-0 border-b border-border gap-2 pb-px" role="tablist">
        <Link
          href={inventoryUrl(
            "egg",
            asOf.dateString,
            asOf.today,
          )}
          role="tab"
          aria-selected={tab === "egg"}
          aria-current={
            tab === "egg"
              ? "page"
              : undefined
          }
          className={[
            "flex items-center gap-2.5 min-w-0 border-b-2 px-5 py-3 text-sm font-semibold transition-all",
            tab === "egg"
              ? "border-primary text-primary-hover bg-primary/10 rounded-t-[10px] shadow-xs"
              : "border-transparent text-muted hover:text-foreground hover:bg-[#F9FAFB]",
          ].join(" ")}
        >
          <Egg className={[
            "h-4 w-4 transition-colors",
            tab === "egg" ? "text-primary-hover" : "text-muted",
          ].join(" ")} />
          <span>Stok Telur</span>
        </Link>

        <Link
          href={inventoryUrl(
            "feed",
            asOf.dateString,
            asOf.today,
          )}
          role="tab"
          aria-selected={tab === "feed"}
          aria-current={
            tab === "feed"
              ? "page"
              : undefined
          }
          className={[
            "flex items-center gap-2.5 min-w-0 border-b-2 px-5 py-3 text-sm font-semibold transition-all",
            tab === "feed"
              ? "border-primary text-primary-hover bg-primary/10 rounded-t-[10px] shadow-xs"
              : "border-transparent text-muted hover:text-foreground hover:bg-[#F9FAFB]",
          ].join(" ")}
        >
          <Wheat className={[
            "h-4 w-4 transition-colors",
            tab === "feed" ? "text-primary-hover" : "text-muted",
          ].join(" ")} />
          <span>Stok Pakan</span>
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