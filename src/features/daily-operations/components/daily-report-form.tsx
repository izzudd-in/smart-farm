"use client";

import {
  type FormEvent,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  CircleCheck,
  LockKeyhole,
  Plus,
} from "lucide-react";

import {
  completeDailyReport,
  saveDailyReportDraft,
} from "@/features/daily-operations/actions/daily-report";
import type { OperatorTodayKandang } from "@/features/daily-operations/types/daily-report";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { ReportStatusBadge } from "./report-status-badge";

type DailyReportFormProps = {
  kandang: OperatorTodayKandang;
};

function valueOrEmpty(
  value: number | null | undefined,
): string {
  return value === null ||
    value === undefined
    ? ""
    : String(value);
}

export function DailyReportForm({
  kandang,
}: DailyReportFormProps) {
  const router = useRouter();

  const report = kandang.report;

  const [saleableEgg, setSaleableEgg] =
    useState(
      valueOrEmpty(
        report?.saleableEgg,
      ),
    );

  const [damagedEgg, setDamagedEgg] =
    useState(
      valueOrEmpty(
        report?.damagedEgg,
      ),
    );

  const [feedUsed, setFeedUsed] =
    useState(
      valueOrEmpty(
        report?.feedUsed,
      ),
    );

  const [mortality, setMortality] =
    useState(
      valueOrEmpty(
        report?.mortality,
      ),
    );

  const [
    incidentalExpense,
    setIncidentalExpense,
  ] = useState(
    report?.incidentalExpense ?? "",
  );

  const [
    incidentNote,
    setIncidentNote,
  ] = useState(
    report?.incidentNote ?? "",
  );

  const [
    optionalOpen,
    setOptionalOpen,
  ] = useState(
    Boolean(
      report?.incidentalExpense ||
        report?.incidentNote,
    ),
  );

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [isPending, startTransition] =
    useTransition();

  const readOnly =
    !kandang.isEditable;

  const disabled =
    isPending || readOnly;

  const coreComplete =
    saleableEgg.trim() !== "" &&
    damagedEgg.trim() !== "" &&
    feedUsed.trim() !== "" &&
    mortality.trim() !== "";

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (readOnly) {
      return;
    }

    setError("");
    setSuccess("");

    const input = {
      kandangId: kandang.id,
      saleableEgg,
      damagedEgg,
      feedUsed,
      mortality,
      incidentalExpense,
      incidentNote,
    };

    startTransition(async () => {
      const result = coreComplete
        ? await completeDailyReport(
            input,
          )
        : await saveDailyReportDraft(
            input,
          );

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSuccess(result.message);

      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4">
          <div className="min-w-0">
            <p className="font-semibold text-foreground">
              {kandang.code} ·{" "}
              {kandang.name}
            </p>

            <p className="mt-1 truncate text-sm text-muted">
              {kandang.flock.name}
            </p>
          </div>

          <ReportStatusBadge
            status={kandang.status}
          />
        </div>

        <div className="space-y-5 p-4">
          {readOnly &&
          kandang.readOnlyReason ? (
            <div className="flex items-start gap-2 rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] p-3 text-sm text-muted">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />

              <span>
                {kandang.readOnlyReason}
              </span>
            </div>
          ) : null}

          {success ? (
            <div
              role="status"
              className="flex items-start gap-2 rounded-[10px] border border-[#BBF7D0] bg-primary-soft p-3 text-sm text-primary-hover"
            >
              <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />

              <span>{success}</span>
            </div>
          ) : null}

          {error ? (
            <div
              role="alert"
              className="rounded-[10px] border border-[#FECACA] bg-danger-soft p-3 text-sm text-danger"
            >
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              label="Telur Jual"
              placeholder="0"
              value={saleableEgg}
              disabled={disabled}
              onChange={(event) =>
                setSaleableEgg(
                  event.target.value,
                )
              }
            />

            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              label="Telur Rusak"
              placeholder="0"
              value={damagedEgg}
              disabled={disabled}
              onChange={(event) =>
                setDamagedEgg(
                  event.target.value,
                )
              }
            />

            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              label="Pakan Digunakan"
              placeholder="0"
              value={feedUsed}
              disabled={disabled}
              onChange={(event) =>
                setFeedUsed(
                  event.target.value,
                )
              }
            />

            <Input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              label="Ayam Mati"
              placeholder="0"
              value={mortality}
              disabled={disabled}
              onChange={(event) =>
                setMortality(
                  event.target.value,
                )
              }
            />
          </div>

          <div className="border-t border-border pt-4">
            <button
              type="button"
              onClick={() =>
                setOptionalOpen(
                  (current) =>
                    !current,
                )
              }
              className="flex w-full items-center justify-between gap-3 rounded-[10px] px-1 py-2 text-left text-sm font-medium text-primary-hover"
            >
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Pengeluaran / Kejadian
              </span>

              {optionalOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {optionalOpen ? (
              <div className="mt-3 space-y-4 rounded-[10px] bg-[#F9FAFB] p-4">
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  label="Pengeluaran Insidental"
                  placeholder="0"
                  value={
                    incidentalExpense
                  }
                  disabled={disabled}
                  onChange={(event) =>
                    setIncidentalExpense(
                      event.target.value,
                    )
                  }
                />

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor={`incident-${kandang.id}`}
                    className="text-[13px] font-medium text-foreground"
                  >
                    Kejadian / Catatan
                  </label>

                  <textarea
                    id={`incident-${kandang.id}`}
                    rows={4}
                    maxLength={1000}
                    value={incidentNote}
                    disabled={disabled}
                    placeholder="Opsional"
                    onChange={(event) =>
                      setIncidentNote(
                        event.target.value,
                      )
                    }
                    className="w-full resize-y rounded-[10px] border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-light focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-[#F3F4F6]"
                  />
                </div>
              </div>
            ) : null}
          </div>

          {!readOnly ? (
            <div>
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isPending}
              >
                {isPending
                  ? "Menyimpan..."
                  : coreComplete
                    ? "Simpan Laporan"
                    : "Simpan Draft"}
              </Button>

              {!coreComplete ? (
                <p className="mt-2 text-center text-xs text-muted">
                  Laporan akan berstatus
                  Belum Lengkap sampai
                  empat input utama diisi.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </Card>
    </form>
  );
}