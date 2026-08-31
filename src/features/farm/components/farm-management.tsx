"use client";

import {
  useState,
  useTransition,
} from "react";
import {
  AlertCircle,
  Bird,
  CalendarDays,
  CheckCircle2,
  Pencil,
  Plus,
  Power,
  PowerOff,
  UserRound,
  Users,
  Warehouse,
  X,
} from "lucide-react";

import { endFlock, setKandangActive } from "@/features/farm/actions/farm";
import type {
  FarmPageData,
  FlockSummary,
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

type FeedbackState = {
  type: "success" | "error";
  message: string;
} | null;

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

  const [
    confirmEndFlock,
    setConfirmEndFlock,
  ] = useState<{
    kandang: KandangSummary;
    flock: FlockSummary;
  } | null>(null);

  const [feedback, setFeedback] =
    useState<FeedbackState>(null);

  const [pendingKandangId, setPendingKandangId] =
    useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [isPending, startTransition] =
    useTransition();

  const activeKandangs = data.kandangs.filter(
    (k) => k.isActive,
  );
  const inactiveKandangs = data.kandangs.filter(
    (k) => !k.isActive,
  );
  const displayedKandangs =
    statusFilter === "active"
      ? activeKandangs
      : statusFilter === "inactive"
        ? inactiveKandangs
        : data.kandangs;

  function toggleKandang(
    kandang: KandangSummary,
  ) {
    setFeedback(null);
    setPendingKandangId(kandang.id);

    startTransition(async () => {
      const result =
        await setKandangActive(
          kandang.id,
          !kandang.isActive,
        );

      setPendingKandangId(null);

      if (!result.success) {
        setFeedback({
          type: "error",
          message: result.error,
        });
      } else {
        setFeedback({
          type: "success",
          message: result.message,
        });
      }
    });
  }

  function handleEndFlock(
    flockId: string,
  ) {
    setFeedback(null);
    startTransition(async () => {
      const result = await endFlock(flockId);
      if (!result.success) {
        setFeedback({
          type: "error",
          message: result.error,
        });
      } else {
        setFeedback({
          type: "success",
          message: result.message,
        });
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
            onClick={() => {
              setFeedback(null);
              setEditingKandang("create");
            }}
          >
            <Plus className="h-4 w-4" />
            Tambah Kandang
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
              className="p-1 text-muted hover:text-foreground"
              aria-label="Tutup notifikasi"
            >
              <X className="h-4 w-4" />
            </button>
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

        {/* Status Filter Tabs */}
        {data.kandangs.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 rounded-[12px] border border-border bg-[#F9FAFB] p-1 text-sm font-medium">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={[
                  "flex items-center gap-2 rounded-[8px] px-3 py-1.5 transition-colors",
                  statusFilter === "all"
                    ? "bg-white text-foreground shadow-sm font-semibold"
                    : "text-muted hover:text-foreground",
                ].join(" ")}
              >
                <span>Semua</span>
                <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-xs text-muted">
                  {data.kandangs.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("active")}
                className={[
                  "flex items-center gap-2 rounded-[8px] px-3 py-1.5 transition-colors",
                  statusFilter === "active"
                    ? "bg-white text-foreground shadow-sm font-semibold"
                    : "text-muted hover:text-foreground",
                ].join(" ")}
              >
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                  Kandang Aktif
                </span>
                <span className="rounded-full bg-[#ECFDF5] px-2 py-0.5 text-xs font-semibold text-[#065F46]">
                  {activeKandangs.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("inactive")}
                className={[
                  "flex items-center gap-2 rounded-[8px] px-3 py-1.5 transition-colors",
                  statusFilter === "inactive"
                    ? "bg-white text-foreground shadow-sm font-semibold"
                    : "text-muted hover:text-foreground",
                ].join(" ")}
              >
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#EF4444]" />
                  Kandang Nonaktif
                </span>
                <span className="rounded-full bg-[#FEF2F2] px-2 py-0.5 text-xs font-semibold text-[#991B1B]">
                  {inactiveKandangs.length}
                </span>
              </button>
            </div>

            <p className="text-xs text-muted">
              Menampilkan {displayedKandangs.length} dari {data.kandangs.length} kandang
            </p>
          </div>
        ) : null}

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
        ) : displayedKandangs.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-8 text-center">
            <Warehouse className="h-8 w-8 text-muted-light" />

            <h2 className="mt-3 font-semibold text-foreground">
              Tidak ada kandang {statusFilter === "active" ? "aktif" : "nonaktif"}
            </h2>

            <p className="mt-1 max-w-sm text-sm text-muted">
              {statusFilter === "active"
                ? "Semua kandang saat ini dalam status nonaktif."
                : "Semua kandang saat ini dalam status aktif."}
            </p>
          </Card>
        ) : (
          <div className="grid min-w-0 gap-4 xl:grid-cols-2">
            {displayedKandangs.map(
              (kandang) => (
                <Card
                  key={kandang.id}
                  className={[
                    "min-w-0 overflow-hidden border-l-4",
                    kandang.isActive
                      ? "border-l-[#10B981] bg-white"
                      : "border-l-[#EF4444] bg-[#FAFAFA]",
                  ].join(" ")}
                >
                  <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className={[
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] font-semibold text-sm",
                          kandang.isActive
                            ? "bg-primary-soft text-primary-hover"
                            : "bg-[#F3F4F6] text-[#6B7280]",
                        ].join(" ")}
                      >
                        {kandang.code}
                      </div>

                      <div className="min-w-0">
                        <h2 className="truncate font-semibold text-foreground">
                          {kandang.name}
                        </h2>

                        <div className="mt-2">
                          {kandang.isActive ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-2.5 py-0.5 text-xs font-semibold text-[#065F46]">
                              <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FECACA] bg-[#FEF2F2] px-2.5 py-0.5 text-xs font-semibold text-[#991B1B]">
                              <span className="h-2 w-2 rounded-full bg-[#EF4444]" />
                              Nonaktif
                            </span>
                          )}
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
                    {!kandang.isActive ? (
                      <div className="flex items-start gap-2 rounded-[10px] border border-[#FECACA] bg-[#FEF2F2]/60 p-3 text-xs text-[#991B1B]">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#EF4444]" />
                        <span>
                          Kandang sedang nonaktif. Aktifkan kandang untuk memulai siklus flock atau mencatat laporan harian.
                        </span>
                      </div>
                    ) : null}

                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-light">
                        Operator
                      </p>

                      {kandang.operators
                        .length === 0 ? (
                        <p className="text-sm text-muted">
                          Belum ada operator ditugaskan.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {kandang.operators.map(
                            (operator) => (
                              <div
                                key={
                                  operator.id
                                }
                                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-[#F9FAFB] px-3 py-1 text-xs font-medium text-foreground"
                              >
                                <UserRound className="h-3.5 w-3.5 shrink-0 text-muted" />

                                <span className="truncate">
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
                        <>
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

                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-danger hover:bg-danger-soft hover:text-danger"
                            onClick={() =>
                              setConfirmEndFlock({
                                kandang,
                                flock: kandang.activeFlock!,
                              })
                            }
                          >
                            Akhiri Flock
                          </Button>
                        </>
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
          onSuccess={(message) => {
            setFeedback({
              type: "success",
              message,
            });
          }}
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
          onSuccess={(message) => {
            setFeedback({
              type: "success",
              message,
            });
          }}
          onClose={() =>
            setFlockDialog(null)
          }
        />
      ) : null}

      {confirmEndFlock ? (
        <ConfirmDialog
          title="Konfirmasi Pengakhiran Flock"
          confirmText="Ya, Akhiri Flock"
          cancelText="Batal"
          variant="destructive"
          isLoading={isPending}
          onConfirm={() => {
            const target = confirmEndFlock;
            setConfirmEndFlock(null);
            handleEndFlock(target.flock.id);
          }}
          onClose={() => setConfirmEndFlock(null)}
          description={
            <div className="space-y-3">
              <p className="text-foreground font-medium">
                Apakah Anda yakin ingin mengakhiri masa aktif flock{" "}
                <strong>{confirmEndFlock.flock.name}</strong> pada kandang{" "}
                <strong>
                  {confirmEndFlock.kandang.name} ({confirmEndFlock.kandang.code})
                </strong>
                ?
              </p>

              <div className="rounded-[10px] border border-[#FECACA] bg-danger-soft p-3 text-xs text-danger leading-relaxed">
                <p className="font-semibold">⚠️ Konsekuensi Pengakhiran Flock:</p>
                <ul className="mt-1 list-disc pl-4 space-y-1">
                  <li>Flock akan diakhiri secara permanen pada tanggal hari ini.</li>
                  <li>Laporan harian yang belum diisi atau masih draft untuk flock ini tidak dapat diubah lagi setelah flock diakhiri.</li>
                  <li>Tindakan ini tidak dapat dibatalkan (undo).</li>
                </ul>
              </div>
            </div>
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