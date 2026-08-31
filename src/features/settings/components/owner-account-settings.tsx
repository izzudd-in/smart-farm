"use client";

import {
  type FormEvent,
  type ReactNode,
  useState,
  useTransition,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  UserRound,
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
  changeOwnerPassword,
  updateOwnerProfile,
} from "@/features/settings/actions/settings";

import type {
  OwnerSettingsData,
} from "@/features/settings/types/settings";

type OwnerAccountSettingsProps = {
  data: OwnerSettingsData;
};

type FeedbackProps = {
  type:
    | "success"
    | "error";

  children:
    ReactNode;
};

function Feedback({
  type,
  children,
}: FeedbackProps) {
  if (
    type === "error"
  ) {
    return (
      <div
        role="alert"
        className="rounded-[10px] border border-[#FECACA] bg-danger-soft px-3 py-2.5 text-sm text-danger"
      >
        {children}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-[10px] border border-[#BBF7D0] bg-primary-soft px-3 py-2.5 text-sm text-primary-hover"
    >
      {children}
    </div>
  );
}

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  autoComplete:
    | "current-password"
    | "new-password";

  disabled: boolean;

  onChange:
    (
      value: string,
    ) => void;

  onToggle:
    () => void;
};

function PasswordField({
  id,
  label,
  value,
  visible,
  autoComplete,
  disabled,
  onChange,
  onToggle,
}: PasswordFieldProps) {
  return (
    <Input
      id={id}
      label={label}
      type={
        visible
          ? "text"
          : "password"
      }
      value={value}
      autoComplete={
        autoComplete
      }
      disabled={
        disabled
      }
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
          aria-pressed={
            visible
          }
          onClick={
            onToggle
          }
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-[#F3F4F6] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 disabled:pointer-events-none disabled:opacity-50"
        >
          {visible ? (
            <EyeOff
              className="h-4 w-4"
              aria-hidden="true"
            />
          ) : (
            <Eye
              className="h-4 w-4"
              aria-hidden="true"
            />
          )}
        </button>
      }
    />
  );
}

export function OwnerAccountSettings({
  data,
}: OwnerAccountSettingsProps) {
  const router =
    useRouter();

  const [
    name,
    setName,
  ] = useState(
    data.name,
  );

  const [
    profileError,
    setProfileError,
  ] = useState("");

  const [
    profileSuccess,
    setProfileSuccess,
  ] = useState("");

  const [
    profilePending,
    startProfileTransition,
  ] = useTransition();

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showCurrentPassword,
    setShowCurrentPassword,
  ] = useState(
    false,
  );

  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(
    false,
  );

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(
    false,
  );

  const [
    passwordError,
    setPasswordError,
  ] = useState("");

  const [
    passwordSuccess,
    setPasswordSuccess,
  ] = useState("");

  const [
    passwordPending,
    startPasswordTransition,
  ] = useTransition();

  function handleProfileSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setProfileError(
      "",
    );

    setProfileSuccess(
      "",
    );

    startProfileTransition(
      async () => {
        const result =
          await updateOwnerProfile({
            name,
          });

        if (
          !result.success
        ) {
          setProfileError(
            result.error,
          );

          return;
        }

        /*
         * Pertahankan form sesuai nilai yang benar-benar
         * disimpan server setelah trim.
         */
        setName(
          name.trim(),
        );

        setProfileSuccess(
          result.message,
        );

        /*
         * OwnerShell menerima current AuthUser dari
         * server. Refresh ini membuat nama di sidebar /
         * mobile account area ikut diperbarui.
         */
        router.refresh();
      },
    );
  }

  function handlePasswordSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setPasswordError(
      "",
    );

    setPasswordSuccess(
      "",
    );

    startPasswordTransition(
      async () => {
        const result =
          await changeOwnerPassword({
            currentPassword,
            newPassword,
            confirmPassword,
          });

        if (
          !result.success
        ) {
          setPasswordError(
            result.error,
          );

          return;
        }

        /*
         * Password tidak dipertahankan pada state
         * setelah perubahan berhasil.
         */
        setCurrentPassword(
          "",
        );

        setNewPassword(
          "",
        );

        setConfirmPassword(
          "",
        );

        setShowCurrentPassword(
          false,
        );

        setShowNewPassword(
          false,
        );

        setShowConfirmPassword(
          false,
        );

        setPasswordSuccess(
          result.message,
        );
      },
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>

        <p className="mt-1 text-sm text-muted">
          Kelola profil akun dan keamanan.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-border p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-primary-soft text-primary-hover">
              <UserRound
                className="h-5 w-5"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0">
              <h2 className="font-semibold text-foreground">
                Profil Akun
              </h2>

              <p className="mt-1 text-sm leading-5 text-muted">
                Informasi dasar akun Owner yang sedang digunakan.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={
            handleProfileSubmit
          }
          className="space-y-5 p-5 sm:p-6"
        >
          {profileError ? (
            <Feedback type="error">
              {profileError}
            </Feedback>
          ) : null}

          {profileSuccess ? (
            <Feedback type="success">
              {profileSuccess}
            </Feedback>
          ) : null}

          <Input
            id="owner-name"
            label="Nama"
            name="name"
            autoComplete="name"
            value={name}
            disabled={
              profilePending
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

          <div className="space-y-1.5">
            <Input
              id="owner-email"
              label="Email"
              value={
                data.email
              }
              type="email"
              readOnly
              autoComplete="username"
              className="cursor-default bg-[#F9FAFB]"
            />

            <p className="text-xs text-muted">
              Digunakan untuk masuk. Email belum dapat diubah dari halaman ini.
            </p>
          </div>

          <Input
            id="owner-role"
            label="Role"
            value={
              data.role ===
              "OWNER"
                ? "Owner"
                : data.role
            }
            readOnly
            className="cursor-default bg-[#F9FAFB]"
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={
                profilePending
              }
              className="min-h-11 w-full sm:w-auto"
            >
              {profilePending
                ? "Menyimpan..."
                : "Simpan Profil"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-border p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#F3F4F6] text-[#4B5563]">
              <LockKeyhole
                className="h-5 w-5"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0">
              <h2 className="font-semibold text-foreground">
                Keamanan
              </h2>

              <p className="mt-1 text-sm leading-5 text-muted">
                Ubah password dengan memverifikasi password saat ini terlebih dahulu.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={
            handlePasswordSubmit
          }
          className="space-y-5 p-5 sm:p-6"
        >
          {passwordError ? (
            <Feedback type="error">
              {passwordError}
            </Feedback>
          ) : null}

          {passwordSuccess ? (
            <Feedback type="success">
              {passwordSuccess}
            </Feedback>
          ) : null}

          <PasswordField
            id="current-password"
            label="Password Saat Ini"
            value={
              currentPassword
            }
            visible={
              showCurrentPassword
            }
            autoComplete="current-password"
            disabled={
              passwordPending
            }
            onChange={
              setCurrentPassword
            }
            onToggle={() =>
              setShowCurrentPassword(
                (
                  current,
                ) =>
                  !current,
              )
            }
          />

          <PasswordField
            id="new-password"
            label="Password Baru"
            value={
              newPassword
            }
            visible={
              showNewPassword
            }
            autoComplete="new-password"
            disabled={
              passwordPending
            }
            onChange={
              setNewPassword
            }
            onToggle={() =>
              setShowNewPassword(
                (
                  current,
                ) =>
                  !current,
              )
            }
          />

          <PasswordField
            id="confirm-password"
            label="Konfirmasi Password"
            value={
              confirmPassword
            }
            visible={
              showConfirmPassword
            }
            autoComplete="new-password"
            disabled={
              passwordPending
            }
            onChange={
              setConfirmPassword
            }
            onToggle={() =>
              setShowConfirmPassword(
                (
                  current,
                ) =>
                  !current,
              )
            }
          />

          <p className="text-xs leading-5 text-muted">
            Password baru minimal 8 karakter (harus mengandung huruf besar, huruf kecil, dan angka) serta berbeda dari password saat ini.
          </p>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={
                passwordPending
              }
              className="min-h-11 w-full sm:w-auto"
            >
              {passwordPending
                ? "Memperbarui..."
                : "Ubah Password"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-border p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#F3F4F6] text-[#4B5563]">
              <ShieldCheck
                className="h-5 w-5"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0">
              <h2 className="font-semibold text-foreground">
                Informasi Sistem
              </h2>

              <p className="mt-1 text-sm leading-5 text-muted">
                Konteks farm dan business time yang digunakan sistem.
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-border">
          <div className="grid min-w-0 gap-1 px-5 py-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center sm:px-6">
            <p className="text-sm text-muted">
              Farm
            </p>

            <p className="min-w-0 break-words text-sm font-medium text-foreground sm:text-right">
              {data.farmName ??
                "Farm PRIMARY belum tersedia"}
            </p>
          </div>

          <div className="grid min-w-0 gap-1 px-5 py-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center sm:px-6">
            <p className="text-sm text-muted">
              Timezone
            </p>

            <p className="min-w-0 break-words text-sm font-medium text-foreground sm:text-right">
              {data.timezone}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}