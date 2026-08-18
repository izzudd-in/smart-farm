import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { FeedUsageData } from "@/features/feed/types/feed";
import { getJakartaTodayString } from "@/features/daily-operations/utils/date";

type FeedUsagePanelProps = {
  data: FeedUsageData;
};

const numberFormatter =
  new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  });

function kg(
  value: number,
): string {
  return `${numberFormatter.format(
    value,
  )} kg`;
}

export function FeedUsagePanel({
  data,
}: FeedUsagePanelProps) {
  const summaryItems = [
    {
      label:
        "Total Pakan Digunakan",

      value: kg(
        data.summary
          .totalFeedUsed,
      ),
    },
    {
      label:
        "Rata-rata / Hari",

      value: kg(
        data.summary
          .averageDailyUsage,
      ),
    },
    {
      label:
        "Jumlah Laporan",

      value: numberFormatter.format(
        data.summary.reportCount,
      ),
    },
    {
      label:
        "Formula Terbanyak",

      value:
        data.summary
          .mostUsedFormula ?? "—",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summaryItems.map(
          (item) => (
            <Card
              key={item.label}
              className="min-w-0 p-4"
            >
              <p className="text-xs text-muted">
                {item.label}
              </p>

              <p className="mt-1 break-words text-lg font-semibold text-foreground">
                {item.value}
              </p>
            </Card>
          ),
        )}
      </div>

      <Card className="p-4">
        <form
          method="get"
          className="grid gap-3 md:grid-cols-[170px_170px_1fr_auto]"
        >
          <input
            type="hidden"
            name="tab"
            value="usage"
          />

          <div>
            <label
              htmlFor="feed-from"
              className="mb-1.5 block text-xs font-medium text-muted"
            >
              Dari
            </label>

            <input
              id="feed-from"
              name="from"
              type="date"
              max={data.filters.to}
              defaultValue={
                data.filters.from
              }
              className="h-10 w-full rounded-[10px] border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div>
            <label
              htmlFor="feed-to"
              className="mb-1.5 block text-xs font-medium text-muted"
            >
              Sampai
            </label>

            <input
              id="feed-to"
              name="to"
              type="date"
              max={
                getJakartaTodayString()
              }
              defaultValue={
                data.filters.to
              }
              className="h-10 w-full rounded-[10px] border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div>
            <label
              htmlFor="feed-kandang"
              className="mb-1.5 block text-xs font-medium text-muted"
            >
              Kandang
            </label>

            <select
              id="feed-kandang"
              name="kandang"
              defaultValue={
                data.filters
                  .kandangId
              }
              className="h-10 w-full rounded-[10px] border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              <option value="">
                Semua Kandang
              </option>

              {data.kandangOptions.map(
                (kandang) => (
                  <option
                    key={
                      kandang.id
                    }
                    value={
                      kandang.id
                    }
                  >
                    {kandang.code} ·{" "}
                    {kandang.name}
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
              href="/feed?tab=usage"
              className="inline-flex h-9 items-center justify-center rounded-[10px] border border-border bg-white px-3 text-xs font-medium text-foreground hover:bg-[#F9FAFB]"
            >
              Reset
            </Link>
          </div>
        </form>
      </Card>

      {data.rows.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="font-medium text-foreground">
            Belum ada pemakaian pakan
            pada periode ini.
          </p>

          <p className="mt-1 text-sm text-muted">
            Data berasal otomatis dari
            Daily Operations.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.rows.map((row) => (
            <Card
              key={row.reportId}
              className="min-w-0 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">
                    {new Intl.DateTimeFormat(
                      "id-ID",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        timeZone:
                          "UTC",
                      },
                    ).format(
                      new Date(
                        `${row.date}T00:00:00.000Z`,
                      ),
                    )}{" "}
                    ·{" "}
                    {row.kandangCode}
                  </p>

                  <p className="mt-1 text-xs text-muted">
                    {row.kandangName} ·{" "}
                    {row.flockName}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    {kg(
                      row.feedUsed,
                    )}
                  </p>

                  <p className="mt-1 text-xs text-muted">
                    {row.formulaName ??
                      "Tanpa Formula"}
                  </p>
                </div>
              </div>

              {row.ingredients
                .length > 0 ? (
                <div className="mt-4 space-y-2 border-t border-border pt-3">
                  {row.ingredients.map(
                    (ingredient) => (
                      <div
                        key={
                          ingredient.ingredientId
                        }
                        className="flex items-center justify-between gap-4 text-sm"
                      >
                        <span className="min-w-0 truncate text-muted">
                          {
                            ingredient.ingredientName
                          }{" "}
                          <span className="text-xs">
                            (
                            {ingredient.percentage.toLocaleString(
                              "id-ID",
                              {
                                maximumFractionDigits:
                                  2,
                              },
                            )}
                            %)
                          </span>
                        </span>

                        <span className="shrink-0 font-medium text-foreground">
                          {kg(
                            ingredient.quantityKg,
                          )}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}