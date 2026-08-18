import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ProductionKandangDetail as ProductionKandangDetailType } from "@/features/production/types/production";
import { getJakartaTodayString } from "@/features/daily-operations/utils/date";

import { ProductionTrend } from "./production-trend";
import { ProductionHistoryList } from "./production-history-list";

type ProductionKandangDetailProps = {
  data: ProductionKandangDetailType;
};

const formatter =
  new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  });

function kg(
  value: number | null,
): string {
  return value === null
    ? "—"
    : `${formatter.format(
        value,
      )} kg`;
}

export function ProductionKandangDetailView({
  data,
}: ProductionKandangDetailProps) {
  const backParams =
    new URLSearchParams({
      from: data.filters.from,
      to: data.filters.to,
      kandang: data.kandang.id,
    });

  const summary = [
    {
      label: "Produksi",
      value: kg(
        data.totalProduction,
      ),
    },
    {
      label: "Telur Rusak",
      value: kg(
        data.damagedEgg,
      ),
    },
    {
      label: "Mortalitas Kumulatif",
      value:
        data.cumulativeMortality ===
        null
          ? "—"
          : formatter.format(
              data.cumulativeMortality,
            ),
    },
    {
      label: "Estimasi Ayam Aktif",
      value:
        data.estimatedPopulation ===
        null
          ? "—"
          : formatter.format(
              data.estimatedPopulation,
            ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/production?${backParams.toString()}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Produksi
        </Link>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
          {data.kandang.code} ·{" "}
          {data.kandang.name}
        </h1>

        <p className="mt-1 text-sm text-muted">
          {data.selectedFlock
            ?.name ??
            "Belum ada flock"}
        </p>
      </div>

      <Card className="p-4">
        <form
          method="get"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[170px_170px_1fr_auto]"
        >
          <div>
            <label
              htmlFor="detail-from"
              className="mb-1.5 block text-xs font-medium text-muted"
            >
              Dari
            </label>

            <input
              id="detail-from"
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
              htmlFor="detail-to"
              className="mb-1.5 block text-xs font-medium text-muted"
            >
              Sampai
            </label>

            <input
              id="detail-to"
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
              htmlFor="detail-flock"
              className="mb-1.5 block text-xs font-medium text-muted"
            >
              Flock
            </label>

            <select
              id="detail-flock"
              name="flock"
              defaultValue={
                data.filters.flockId
              }
              className="h-10 w-full rounded-[10px] border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              {data.flockOptions.map(
                (flock) => (
                  <option
                    key={flock.id}
                    value={flock.id}
                  >
                    {flock.name}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="flex items-end">
            <Button
              type="submit"
              size="sm"
              className="w-full lg:w-auto"
            >
              Terapkan
            </Button>
          </div>
        </form>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map((item) => (
          <Card
            key={item.label}
            className="p-4"
          >
            <p className="text-xs text-muted">
              {item.label}
            </p>

            <p className="mt-1 text-xl font-semibold text-foreground">
              {item.value}
            </p>
          </Card>
        ))}
      </div>

      <ProductionTrend
        points={data.trend}
      />

      <div>
        <h2 className="mb-3 font-semibold text-foreground">
          History Flock
        </h2>

        <div className="space-y-3">
          {data.history.map(
            (report) => (
              <Card
                key={report.id}
                className="p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">
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
                          `${report.date}T00:00:00.000Z`,
                        ),
                      )}
                    </p>

                    <p className="mt-1 text-xs text-muted">
                      {report.flockName}
                    </p>
                  </div>

                  <p className="text-sm font-semibold text-foreground">
                    {kg(
                      report.totalEgg,
                    )}
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 sm:grid-cols-4">
                  <div>
                    <p className="text-[11px] text-muted">
                      Jual
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {kg(
                        report.saleableEgg,
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-muted">
                      Rusak
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {kg(
                        report.damagedEgg,
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-muted">
                      Mati Kumulatif
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {report.cumulativeMortality ??
                        0}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-muted">
                      Est. Populasi
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {report.estimatedPopulation ===
                      undefined
                        ? "—"
                        : formatter.format(
                            report.estimatedPopulation,
                          )}
                    </p>
                  </div>
                </div>
              </Card>
            ),
          )}
        </div>

        {data.history.length === 0 ? (
          <ProductionHistoryList
            rows={[]}
            showKandang={false}
          />
        ) : null}
      </div>
    </div>
  );
}