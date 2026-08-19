import type {
  ChangeOwnerPasswordInput,
  OwnerProfileInput,
} from "@/features/settings/types/settings";

export class SettingsValidationError extends Error {}

export function parseOwnerProfileInput(
  input: OwnerProfileInput,
) {
  const name =
    input.name.trim();

  if (!name) {
    throw new SettingsValidationError(
      "Nama wajib diisi.",
    );
  }

  if (name.length < 2) {
    throw new SettingsValidationError(
      "Nama minimal 2 karakter.",
    );
  }

  if (name.length > 100) {
    throw new SettingsValidationError(
      "Nama maksimal 100 karakter.",
    );
  }

  return {
    name,
  };
}

export function parseChangeOwnerPasswordInput(
  input: ChangeOwnerPasswordInput,
) {
  const currentPassword =
    input.currentPassword;

  const newPassword =
    input.newPassword;

  const confirmPassword =
    input.confirmPassword;

  if (!currentPassword) {
    throw new SettingsValidationError(
      "Password saat ini wajib diisi.",
    );
  }

  if (!newPassword) {
    throw new SettingsValidationError(
      "Password baru wajib diisi.",
    );
  }

  if (
    newPassword.length < 8
  ) {
    throw new SettingsValidationError(
      "Password baru minimal 8 karakter.",
    );
  }

  if (
    !newPassword.trim()
  ) {
    throw new SettingsValidationError(
      "Password baru tidak valid.",
    );
  }

  if (
    newPassword !==
    confirmPassword
  ) {
    throw new SettingsValidationError(
      "Konfirmasi password tidak sama.",
    );
  }

  return {
    currentPassword,
    newPassword,
  };
}