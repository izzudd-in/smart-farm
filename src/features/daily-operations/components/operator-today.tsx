"use client";

import { useState } from "react";
import {
  CalendarDays,
  Warehouse,
} from "lucide-react";

import type {
  OperatorTodayData,
} from "@/features/daily-operations/types/daily-report";
import {
  formatReportDate,
} from "@/features/daily-operations/utils/date";
import { Card } from "@/components/ui/card";

import { DailyReportForm } from "./daily-report-form";

type OperatorTodayProps = {
  data: OperatorTodayData;
};

export function OperatorToday({
  data,
}: OperatorTodayProps) {
  const [
    selectedKandangId,
    setSelectedKandangId,
  ] = useState(
    data.kandangs[0]?.id ?? "",
  );

  const selectedKandang =
    data.kandangs.find(
      (kandang) =>
        kandang.id ===
        selectedKandangId,
    ) ?? data.kandangs[0];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Hari Ini
        </h1>

        <div className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          <CalendarDays className="h-4 w-4" />

          <span>
            {formatReportDate(
              data.date,
            )}
          </span>
        </div>
      </div>

      {data.kandangs.length === 0 ? (
        <Card className="flex flex-col items-center p-8 text-center">
          <Warehouse className="h-8 w-8 text-muted-light" />

          <h2 className="mt-3 font-semibold text-foreground">
            Belum ada kandang aktif
          </h2>

          <p className="mt-1 text-sm text-muted">
            Anda belum memiliki kandang
            aktif dengan flock aktif yang
            dapat diisi hari ini.
          </p>
        </Card>
      ) : (
        <>
          {data.kandangs.length > 1 ? (
            <div>
              <label
                htmlFor="kandang-selector"
                className="mb-1.5 block text-[13px] font-medium text-foreground"
              >
                Pilih Kandang
              </label>

              <select
                id="kandang-selector"
                value={selectedKandangId}
                onChange={(event) =>
                  setSelectedKandangId(
                    event.target.value,
                  )
                }
                className="h-11 w-full rounded-[10px] border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              >
                {data.kandangs.map(
                  (kandang) => (
                    <option
                      key={kandang.id}
                      value={kandang.id}
                    >
                      {kandang.code} ·{" "}
                      {kandang.name}
                    </option>
                  ),
                )}
              </select>
            </div>
          ) : null}

          {selectedKandang ? (
            <DailyReportForm
              key={selectedKandang.id}
              kandang={
                selectedKandang
              }
            />
          ) : null}
        </>
      )}
    </div>
  );
}