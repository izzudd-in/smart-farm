"use client";

import {
  type FormEvent,
  useState,
  useTransition,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Eye,
  EyeOff,
  KeyRound,
  Plus,
  Power,
  PowerOff,
  UsersRound,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
} from "@/components/ui/card";

import {
  Input,
} from "@/components/ui/input";

import {
  createOperator,
  resetOperatorPassword,
  setOperatorActive,
  updateOperatorAssignments,
} from "@/features/settings/actions/settings";

import type {
  OperatorAssignmentOption,
  OperatorManagementData,
  OperatorView,
} from "@/features/settings/types/settings";

type OperatorManagementProps = {
  data:
    OperatorManagementData;
};

type Feedback = {
  type:
    | "success"
    | "error";

  message:
    string;
} | null;

function updateSelection(
  current: string[],
  id: string,
  checked: boolean,
): string[] {
  if (
    checked
  ) {
    return current.includes(
      id,
    )
      ? current
      : [
          ...current,
          id,
        ];
  }

  return current.filter(
    (
      value,
    ) =>
      value !== id,
  );
}

function KandangOptions({
  options,
  selected,
  disabled,
  onChange,
}: {
  options:
    OperatorAssignmentOption[];

  selected:
    string[];

  disabled:
    boolean;

  onChange:
    (
      ids: string[],
    ) => void;
}) {
  if (
    options.length ===
    0
  ) {
    return (
      <p className="text-sm text-muted">
        Belum ada kandang aktif yang dapat di-assign.
      </p>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map(
        (
          kandang,
        ) => {
          const checked =
            selected.includes(
              kandang.id,
            );

          return (
            <label
              key={
                kandang.id
              }
              className="flex min-h-11 cursor-pointer items-start gap-3 rounded-[10px] border border-border bg-white px-3 py-2.5"
            >
              <input
                type="checkbox"
                checked={
                  checked
                }
                disabled={
                  disabled
                }
                onChange={(
                  event,
                ) =>
                  onChange(
                    updateSelection(
                      selected,
                      kandang.id,
                      event.target.checked,
                    ),
                  )
                }
                className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
              />

              <span className="min-w-0">
                <span className="block break-words text-sm font-medium text-foreground">
                  {
                    kandang.name
                  }
                </span>

                <span className="block text-xs text-muted">
                  {
                    kandang.code
                  }
                </span>
              </span>
            </label>
          );
        },
      )}
    </div>
  );
}

function PasswordInput({
  id,
  label,
  value,
  visible,
  disabled,
  onChange,
  onToggle,
}: {
  id:
    string;

  label:
    string;

  value:
    string;

  visible:
    boolean;

  disabled:
    boolean;

  onChange:
    (
      value: string,
    ) => void;

  onToggle:
    () => void;
}) {
  return (
    <Input
      id={id}
      label={label}
      type={
        visible
          ? "text"
          : "password"
      }
      value={
        value
      }
      disabled={
        disabled
      }
      autoComplete="new-password"
      onChange={(
        event,
      ) =>
        onChange(
          event.target.value,
        )
      }
      endAdornment={
        <button
          type="button"
          disabled={
            disabled
          }
          aria-label={
            visible
              ? "Sembunyikan password"
              : "Tampilkan password"
          }
          onClick={
            onToggle
          }
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-[#F3F4F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 disabled:pointer-events-none disabled:opacity-50"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      }
    />
  );
}

function AssignedKandangs({
  operator,
}: {
  operator:
    OperatorView;
}) {
  if (
    operator.kandangs.length ===
    0
  ) {
    return (
      <p className="text-xs text-muted">
        Belum di-assign ke kandang.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {operator.kandangs.map(
        (
          kandang,
        ) => (
          <span
            key={
              kandang.id
            }
            className={[
              "rounded-full border px-2 py-1 text-[10px] font-medium",
              kandang.isActive
                ? "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]"
                : "border-border bg-[#F9FAFB] text-muted",
            ].join(
              " ",
            )}
          >
            {kandang.name}
            {!kandang.isActive
              ? " · nonaktif"
              : ""}
          </span>
        ),
      )}
    </div>
  );
}

export function OperatorManagement({
  data,
}: OperatorManagementProps) {
  const router =
    useRouter();

  const [
    pending,
    startTransition,
  ] = useTransition();

  const [
    feedback,
    setFeedback,
  ] =
    useState<Feedback>(
      null,
    );

  const [
    createOpen,
    setCreateOpen,
  ] =
    useState(
      false,
    );

  const [
    name,
    setName,
  ] =
    useState("");

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    initialPassword,
    setInitialPassword,
  ] =
    useState("");

  const [
    initialPasswordVisible,
    setInitialPasswordVisible,
  ] =
    useState(
      false,
    );

  const [
    createKandangIds,
    setCreateKandangIds,
  ] =
    useState<string[]>(
      [],
    );

  const [
    assignmentOperatorId,
    setAssignmentOperatorId,
  ] =
    useState<
      string | null
    >(
      null,
    );

  const [
    assignmentIds,
    setAssignmentIds,
  ] =
    useState<string[]>(
      [],
    );

  const [
    passwordOperatorId,
    setPasswordOperatorId,
  ] =
    useState<
      string | null
    >(
      null,
    );

  const [
    resetPassword,
    setResetPassword,
  ] =
    useState("");

  const [
    resetConfirmPassword,
    setResetConfirmPassword,
  ] =
    useState("");

  const [
    resetPasswordVisible,
    setResetPasswordVisible,
  ] =
    useState(
      false,
    );

  const [
    resetConfirmVisible,
    setResetConfirmVisible,
  ] =
    useState(
      false,
    );

  function runMutation(
    mutation:
      () => Promise<{
        success:
          boolean;

        message?:
          string;

        error?:
          string;
      }>,

    onSuccess?:
      () => void,
  ) {
    setFeedback(
      null,
    );

    startTransition(
      async () => {
        const result =
          await mutation();

        if (
          !result.success
        ) {
          setFeedback({
            type:
              "error",

            message:
              result.error ??
              "Terjadi kesalahan. Silakan coba lagi.",
          });

          return;
        }

        onSuccess?.();

        setFeedback({
          type:
            "success",

          message:
            result.message ??
            "Perubahan berhasil disimpan.",
        });

        router.refresh();
      },
    );
  }

  function handleCreate(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    runMutation(
      () =>
        createOperator({
          name,
          email,
          password:
            initialPassword,

          kandangIds:
            createKandangIds,
        }),

      () => {
        setName(
          "",
        );

        setEmail(
          "",
        );

        setInitialPassword(
          "",
        );

        setInitialPasswordVisible(
          false,
        );

        setCreateKandangIds(
          [],
        );

        setCreateOpen(
          false,
        );
      },
    );
  }

  function openAssignment(
    operator:
      OperatorView,
  ) {
    setAssignmentOperatorId(
      operator.id,
    );

    /*
     * Hanya active kandang yang ditawarkan
     * untuk current assignment baru.
     */
    setAssignmentIds(
      operator.kandangs
        .filter(
          (
            kandang,
          ) =>
            kandang.isActive,
        )
        .map(
          (
            kandang,
          ) =>
            kandang.id,
        ),
    );

    setPasswordOperatorId(
      null,
    );

    setFeedback(
      null,
    );
  }

  function saveAssignment(
    operatorId:
      string,
  ) {
    runMutation(
      () =>
        updateOperatorAssignments({
          operatorId,

          kandangIds:
            assignmentIds,
        }),

      () => {
        setAssignmentOperatorId(
          null,
        );

        setAssignmentIds(
          [],
        );
      },
    );
  }

  function openResetPassword(
    operatorId:
      string,
  ) {
    setPasswordOperatorId(
      operatorId,
    );

    setResetPassword(
      "",
    );

    setResetConfirmPassword(
      "",
    );

    setResetPasswordVisible(
      false,
    );

    setResetConfirmVisible(
      false,
    );

    setAssignmentOperatorId(
      null,
    );

    setFeedback(
      null,
    );
  }

  function saveResetPassword(
    operatorId:
      string,
  ) {
    runMutation(
      () =>
        resetOperatorPassword({
          operatorId,

          newPassword:
            resetPassword,

          confirmPassword:
            resetConfirmPassword,
        }),

      () => {
        setPasswordOperatorId(
          null,
        );

        setResetPassword(
          "",
        );

        setResetConfirmPassword(
          "",
        );

        setResetPasswordVisible(
          false,
        );

        setResetConfirmVisible(
          false,
        );
      },
    );
  }

  return (
    <Card className="mx-auto mt-6 w-full max-w-3xl overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-primary-soft text-primary-hover">
            <UsersRound className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h2 className="font-semibold text-foreground">
              Operator
            </h2>

            <p className="mt-1 text-sm leading-5 text-muted">
              Kelola akun Operator dan assignment kandang.
            </p>
          </div>
        </div>

        <Button
          type="button"
          disabled={
            pending
          }
          onClick={() =>
            setCreateOpen(
              (
                value,
              ) =>
                !value,
            )
          }
          className="min-h-11 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />

          Tambah Operator
        </Button>
      </div>

      {feedback ? (
        <div className="px-5 pt-5 sm:px-6">
          <div
            role={
              feedback.type ===
              "error"
                ? "alert"
                : "status"
            }
            className={[
              "rounded-[10px] border px-3 py-2.5 text-sm",
              feedback.type ===
              "error"
                ? "border-[#FECACA] bg-danger-soft text-danger"
                : "border-[#BBF7D0] bg-primary-soft text-primary-hover",
            ].join(
              " ",
            )}
          >
            {
              feedback.message
            }
          </div>
        </div>
      ) : null}

      {createOpen ? (
        <form
          onSubmit={
            handleCreate
          }
          className="space-y-5 border-b border-border bg-[#F9FAFB] p-5 sm:p-6"
        >
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Operator Baru
            </h3>

            <p className="mt-1 text-xs text-muted">
              Role ditetapkan server sebagai Operator.
            </p>
          </div>

          <Input
            id="operator-name"
            label="Nama"
            value={
              name
            }
            disabled={
              pending
            }
            maxLength={
              100
            }
            onChange={(
              event,
            ) =>
              setName(
                event.target.value,
              )
            }
          />

          <Input
            id="operator-email"
            label="Email"
            type="email"
            value={
              email
            }
            disabled={
              pending
            }
            autoComplete="off"
            onChange={(
              event,
            ) =>
              setEmail(
                event.target.value,
              )
            }
          />

          <PasswordInput
            id="operator-initial-password"
            label="Password Awal"
            value={
              initialPassword
            }
            visible={
              initialPasswordVisible
            }
            disabled={
              pending
            }
            onChange={
              setInitialPassword
            }
            onToggle={() =>
              setInitialPasswordVisible(
                (
                  value,
                ) =>
                  !value,
              )
            }
          />

          <div className="space-y-2">
            <p className="text-[13px] font-medium text-foreground">
              Assignment Kandang
            </p>

            <KandangOptions
              options={
                data.activeKandangs
              }
              selected={
                createKandangIds
              }
              disabled={
                pending
              }
              onChange={
                setCreateKandangIds
              }
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              disabled={
                pending
              }
              onClick={() =>
                setCreateOpen(
                  false,
                )
              }
              className="min-h-11"
            >
              Batal
            </Button>

            <Button
              type="submit"
              disabled={
                pending
              }
              className="min-h-11"
            >
              {pending
                ? "Menyimpan..."
                : "Simpan Operator"}
            </Button>
          </div>
        </form>
      ) : null}

      <div className="divide-y divide-border">
        {data.operators.length ===
        0 ? (
          <div className="p-5 text-sm text-muted sm:p-6">
            Belum ada Operator.
          </div>
        ) : (
          data.operators.map(
            (
              operator,
            ) => (
              <div
                key={
                  operator.id
                }
                className="space-y-4 p-5 sm:p-6"
              >
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="break-words text-sm font-semibold text-foreground">
                        {
                          operator.name
                        }
                      </p>

                      <span
                        className={[
                          "rounded-full border px-2 py-1 text-[10px] font-medium",
                          operator.isActive
                            ? "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]"
                            : "border-border bg-[#F9FAFB] text-muted",
                        ].join(
                          " ",
                        )}
                      >
                        {operator.isActive
                          ? "Aktif"
                          : "Nonaktif"}
                      </span>
                    </div>

                    <p className="mt-1 break-all text-xs text-muted">
                      {
                        operator.email
                      }
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant={
                      operator.isActive
                        ? "destructive"
                        : "secondary"
                    }
                    size="sm"
                    disabled={
                      pending
                    }
                    onClick={() =>
                      runMutation(
                        () =>
                          setOperatorActive({
                            operatorId:
                              operator.id,

                            isActive:
                              !operator.isActive,
                          }),
                      )
                    }
                  >
                    {operator.isActive ? (
                      <PowerOff className="h-4 w-4" />
                    ) : (
                      <Power className="h-4 w-4" />
                    )}

                    {operator.isActive
                      ? "Nonaktifkan"
                      : "Aktifkan"}
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted">
                    Kandang Assigned
                  </p>

                  <AssignedKandangs
                    operator={
                      operator
                    }
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={
                      pending
                    }
                    onClick={() =>
                      assignmentOperatorId ===
                      operator.id
                        ? setAssignmentOperatorId(
                            null,
                          )
                        : openAssignment(
                            operator,
                          )
                    }
                  >
                    Atur Kandang
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={
                      pending
                    }
                    onClick={() =>
                      passwordOperatorId ===
                      operator.id
                        ? setPasswordOperatorId(
                            null,
                          )
                        : openResetPassword(
                            operator.id,
                          )
                    }
                  >
                    <KeyRound className="h-4 w-4" />

                    Reset Password
                  </Button>
                </div>

                {assignmentOperatorId ===
                operator.id ? (
                  <div className="space-y-4 rounded-[10px] border border-border bg-[#F9FAFB] p-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Assignment Kandang
                      </p>

                      <p className="mt-1 text-xs leading-5 text-muted">
                        Perubahan hanya memengaruhi akses operasional berikutnya. Daily Report historis tidak diubah.
                      </p>
                    </div>

                    <KandangOptions
                      options={
                        data.activeKandangs
                      }
                      selected={
                        assignmentIds
                      }
                      disabled={
                        pending
                      }
                      onChange={
                        setAssignmentIds
                      }
                    />

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        disabled={
                          pending
                        }
                        onClick={() =>
                          saveAssignment(
                            operator.id,
                          )
                        }
                      >
                        {pending
                          ? "Menyimpan..."
                          : "Simpan Assignment"}
                      </Button>
                    </div>
                  </div>
                ) : null}

                {passwordOperatorId ===
                operator.id ? (
                  <div className="space-y-4 rounded-[10px] border border-border bg-[#F9FAFB] p-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Reset Password
                      </p>

                      <p className="mt-1 text-xs text-muted">
                        Password lama tidak ditampilkan.
                      </p>
                    </div>

                    <PasswordInput
                      id={`reset-password-${operator.id}`}
                      label="Password Baru"
                      value={
                        resetPassword
                      }
                      visible={
                        resetPasswordVisible
                      }
                      disabled={
                        pending
                      }
                      onChange={
                        setResetPassword
                      }
                      onToggle={() =>
                        setResetPasswordVisible(
                          (
                            value,
                          ) =>
                            !value,
                        )
                      }
                    />

                    <PasswordInput
                      id={`reset-confirm-${operator.id}`}
                      label="Konfirmasi Password"
                      value={
                        resetConfirmPassword
                      }
                      visible={
                        resetConfirmVisible
                      }
                      disabled={
                        pending
                      }
                      onChange={
                        setResetConfirmPassword
                      }
                      onToggle={() =>
                        setResetConfirmVisible(
                          (
                            value,
                          ) =>
                            !value,
                        )
                      }
                    />

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        disabled={
                          pending
                        }
                        onClick={() =>
                          saveResetPassword(
                            operator.id,
                          )
                        }
                      >
                        {pending
                          ? "Memperbarui..."
                          : "Simpan Password Baru"}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            ),
          )
        )}
      </div>
    </Card>
  );
}