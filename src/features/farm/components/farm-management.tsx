"use client";

import {
  useState,
  useTransition,
} from "react";
import {
  Bird,
  CalendarDays,
  Pencil,
  Plus,
  Power,
  PowerOff,
  UserRound,
  Users,
  Warehouse,
} from "lucide-react";

import { setKandangActive } from "@/features/farm/actions/farm";
import type {
  FarmPageData,
  KandangSummary,
} from "@/features/farm/types/farm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import { FlockFormDialog } from "./flock-form-dialog";
import { KandangFormDialog } from "./kandang-form-dialog";

type FarmManagementProps = {
  data: FarmPageData;
};

type FlockDialogState =
  | {
      mode: "start";
      kandang: KandangSummary;
    }
  | {
      mode: "edit";
      kandang: KandangSummary;
    }
  | null;

const numberFormatter =
  new Intl.NumberFormat("id-ID");

function formatDate(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(
    new Date(
      `${value}T00:00:00`,
    ),
  );
}

export function FarmManagement({
  data,
}: FarmManagementProps) {
  const [
    editingKandang,
    setEditingKandang,
  ] = useState<
    KandangSummary | "create" | null
  >(null);

  const [
    flockDialog,
    setFlockDialog,
  ] = useState<FlockDialogState>(null);

  const [
    confirmDeactivateKandang,
    setConfirmDeactivateKandang,
  ] = useState<KandangSummary | null>(null);

  const [actionError, setActionError] =
    useState("");

  const [pendingKandangId, setPendingKandangId] =
    useState<string | null>(null);

  const [isPending, startTransition] =
    useTransition();

  function toggleKandang(
    kandang: KandangSummary,
  ) {
    setActionError("");
    setPendingKandangId(kandang.id);

    startTransition(async () => {
      const result =
        await setKandangActive(
          kandang.id,
          !kandang.isActive,
        );

      setPendingKandangId(null);

      if (!result.success) {
        setActionError(result.error);
      }
    });
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Kandang & Flock
            </h1>

            <p className="mt-1 text-sm text-muted">
              Kelola kandang, flock aktif,
              populasi awal, dan operator.
            </p>
          </div>

          <Button
            className="w-full sm:w-auto"
            onClick={() =>
              setEditingKandang("create")
            }
          >
            <Plus className="h-4 w-4" />
            Tambah Kandang
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

        <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-primary-soft text-primary-hover">
              <Warehouse className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">
                {data.name}
              </p>

              <p className="text-xs text-muted">
                {data.code} ·{" "}
                {data.kandangs.length} kandang
              </p>
            </div>
          </div>

          <Badge
            variant={
              data.isActive
                ? "success"
                : "neutral"
            }
          >
            {data.isActive
              ? "Farm Aktif"
              : "Farm Nonaktif"}
          </Badge>
        </Card>

        {data.kandangs.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-8 text-center">
            <Warehouse className="h-8 w-8 text-muted-light" />

            <h2 className="mt-3 font-semibold text-foreground">
              Belum ada kandang
            </h2>

            <p className="mt-1 max-w-sm text-sm text-muted">
              Tambahkan kandang pertama
              untuk memulai struktur farm.
            </p>
          </Card>
        ) : (
          <div className="grid min-w-0 gap-4 xl:grid-cols-2">
            {data.kandangs.map(
              (kandang) => (
                <Card
                  key={kandang.id}
                  className="min-w-0 overflow-hidden"
                >
                  <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#F3F4F6] font-semibold text-[#4B5563]">
                        {kandang.code}
                      </div>

                      <div className="min-w-0">
                        <h2 className="truncate font-semibold text-foreground">
                          {kandang.name}
                        </h2>

                        <div className="mt-2">
                          <Badge
                            variant={
                              kandang.isActive
                                ? "success"
                                : "neutral"
                            }
                          >
                            {kandang.isActive
                              ? "Aktif"
                              : "Nonaktif"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setEditingKandang(
                          kandang,
                        )
                      }
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </div>

                  <div className="space-y-4 p-5">
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-light">
                        Operator
                      </p>

                      {kandang.operators
                        .length === 0 ? (
                        <p className="text-sm text-muted">
                          Belum ada operator.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {kandang.operators.map(
                            (operator) => (
                              <div
                                key={
                                  operator.id
                                }
                                className="flex min-w-0 items-center gap-2 text-sm"
                              >
                                <UserRound className="h-4 w-4 shrink-0 text-muted" />

                                <span className="truncate text-foreground">
                                  {
                                    operator.name
                                  }
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>

                    <div className="rounded-[10px] border border-border bg-[#F9FAFB] p-4">
                      {kandang.activeFlock ? (
                        <>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Bird className="h-4 w-4 text-primary-hover" />

                              <p className="font-medium text-foreground">
                                {
                                  kandang
                                    .activeFlock
                                    .name
                                }
                              </p>
                            </div>

                            <Badge variant="success">
                              Flock Aktif
                            </Badge>
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div>
                              <div className="flex items-center gap-1.5 text-xs text-muted">
                                <CalendarDays className="h-3.5 w-3.5" />
                                Mulai
                              </div>

                              <p className="mt-1 text-sm font-medium text-foreground">
                                {formatDate(
                                  kandang
                                    .activeFlock
                                    .startDate,
                                )}
                              </p>
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5 text-xs text-muted">
                                <CalendarDays className="h-3.5 w-3.5" />
                                Umur
                              </div>

                              <p className="mt-1 text-sm font-medium text-foreground">
                                {
                                  kandang
                                    .activeFlock
                                    .ageLabel
                                }
                              </p>
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5 text-xs text-muted">
                                <Users className="h-3.5 w-3.5" />
                                Populasi Awal
                              </div>

                              <p className="mt-1 text-sm font-medium text-foreground">
                                {numberFormatter.format(
                                  kandang
                                    .activeFlock
                                    .initialPopulation,
                                )}
                              </p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-muted">
                          Belum ada flock aktif.
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                      {kandang.isActive ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            setFlockDialog({
                              mode: "start",
                              kandang,
                            })
                          }
                        >
                          <Plus className="h-3.5 w-3.5" />
                          {kandang.activeFlock
                            ? "Flock Baru"
                            : "Mulai Flock"}
                        </Button>
                      ) : null}

                      {kandang.activeFlock ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setFlockDialog({
                              mode: "edit",
                              kandang,
                            })
                          }
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit Flock
                        </Button>
                      ) : null}

                      <Button
                        size="sm"
                        variant={
                          kandang.isActive
                            ? "destructive"
                            : "secondary"
                        }
                        disabled={
                          isPending &&
                          pendingKandangId ===
                            kandang.id
                        }
                        onClick={() => {
                          if (kandang.isActive) {
                            setConfirmDeactivateKandang(kandang);
                          } else {
                            toggleKandang(kandang);
                          }
                        }}
                      >
                        {kandang.isActive ? (
                          <PowerOff className="h-3.5 w-3.5" />
                        ) : (
                          <Power className="h-3.5 w-3.5" />
                        )}

                        {isPending &&
                        pendingKandangId ===
                          kandang.id
                          ? "Memproses..."
                          : kandang.isActive
                            ? "Nonaktifkan"
                            : "Aktifkan"}
                      </Button>
                    </div>
                  </div>
                </Card>
              ),
            )}
          </div>
        )}
      </div>

      {editingKandang ? (
        <KandangFormDialog
          kandang={
            editingKandang === "create"
              ? undefined
              : editingKandang
          }
          operators={data.operators}
          onClose={() =>
            setEditingKandang(null)
          }
        />
      ) : null}

      {flockDialog ? (
        <FlockFormDialog
          kandang={flockDialog.kandang}
          flock={
            flockDialog.mode === "edit"
              ? flockDialog.kandang
                  .activeFlock ?? undefined
              : undefined
          }
          onClose={() =>
            setFlockDialog(null)
          }
        />
      ) : null}

      {confirmDeactivateKandang ? (
        <ConfirmDialog
          title="Konfirmasi Nonaktifkan Kandang"
          confirmText="Ya, Nonaktifkan"
          cancelText="Batal"
          variant="destructive"
          isLoading={
            isPending &&
            pendingKandangId ===
              confirmDeactivateKandang.id
          }
          onConfirm={() => {
            const target = confirmDeactivateKandang;
            setConfirmDeactivateKandang(null);
            toggleKandang(target);
          }}
          onClose={() =>
            setConfirmDeactivateKandang(null)
          }
          description={
            confirmDeactivateKandang.activeFlock ? (
              <div className="space-y-3">
                <p className="text-foreground font-medium">
                  Apakah Anda yakin ingin menonaktifkan kandang{" "}
                  <strong>
                    {confirmDeactivateKandang.name} (
                    {confirmDeactivateKandang.code})
                  </strong>
                  ?
                </p>

                <div className="rounded-[10px] border border-[#FECACA] bg-danger-soft p-3 text-xs text-danger leading-relaxed">
                  <p className="font-semibold">
                    ⚠️ Peringatan Tindakan Destruktif:
                  </p>
                  <p className="mt-1">
                    Kandang ini memiliki flock aktif{" "}
                    <strong>
                      {confirmDeactivateKandang.activeFlock.name}
                    </strong>
                    . Menonaktifkan kandang akan{" "}
                    <strong>otomatis mengakhiri masa flock aktif</strong> hari
                    ini dan menonaktifkan pencatatan operasional harian pada
                    kandang ini.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-foreground">
                  Apakah Anda yakin ingin menonaktifkan kandang{" "}
                  <strong>
                    {confirmDeactivateKandang.name} (
                    {confirmDeactivateKandang.code})
                  </strong>
                  ?
                </p>
                <p className="text-xs text-muted">
                  Kandang yang dinonaktifkan tidak dapat digunakan untuk
                  pencatatan operasional harian hingga diaktifkan kembali.
                </p>
              </div>
            )
          }
        />
      ) : null}
    </>
  );
}