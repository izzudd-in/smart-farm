import type {
  ChangeOwnerPasswordInput,
  CreateOperatorInput,
  OwnerProfileInput,
  ResetOperatorPasswordInput,
  SetOperatorActiveInput,
  UpdateOperatorAssignmentsInput,
} from "@/features/settings/types/settings";

export class SettingsValidationError extends Error {}

function parseName(
  value: string,
): string {
  const name =
    value.trim();

  if (!name) {
    throw new SettingsValidationError(
      "Nama wajib diisi.",
    );
  }

  if (
    name.length < 2
  ) {
    throw new SettingsValidationError(
      "Nama minimal 2 karakter.",
    );
  }

  if (
    name.length > 100
  ) {
    throw new SettingsValidationError(
      "Nama maksimal 100 karakter.",
    );
  }

  return name;
}

function parseEmail(
  value: string,
): string {
  const email =
    value
      .trim()
      .toLowerCase();

  if (!email) {
    throw new SettingsValidationError(
      "Email wajib diisi.",
    );
  }

  if (
    email.length > 254
  ) {
    throw new SettingsValidationError(
      "Email terlalu panjang.",
    );
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email,
    )
  ) {
    throw new SettingsValidationError(
      "Format email tidak valid.",
    );
  }

  return email;
}

export function parseNewPassword(
  value: string,
): string {
  if (!value) {
    throw new SettingsValidationError(
      "Password baru wajib diisi.",
    );
  }

  if (
    value.length < 8
  ) {
    throw new SettingsValidationError(
      "Password minimal 8 karakter.",
    );
  }

  if (!/[A-Z]/.test(value)) {
    throw new SettingsValidationError(
      "Password harus mengandung minimal 1 huruf besar (A-Z).",
    );
  }

  if (!/[a-z]/.test(value)) {
    throw new SettingsValidationError(
      "Password harus mengandung minimal 1 huruf kecil (a-z).",
    );
  }

  if (!/[0-9]/.test(value)) {
    throw new SettingsValidationError(
      "Password harus mengandung minimal 1 angka (0-9).",
    );
  }

  if (
    !value.trim()
  ) {
    throw new SettingsValidationError(
      "Password tidak valid.",
    );
  }

  return value;
}

function parseId(
  value: string,
  label: string,
): string {
  const id =
    value.trim();

  if (!id) {
    throw new SettingsValidationError(
      `${label} tidak valid.`,
    );
  }

  return id;
}

function parseKandangIds(
  values: string[],
): string[] {
  if (
    !Array.isArray(
      values,
    )
  ) {
    throw new SettingsValidationError(
      "Assignment kandang tidak valid.",
    );
  }

  return Array.from(
    new Set(
      values
        .map(
          (
            value,
          ) =>
            value.trim(),
        )
        .filter(
          Boolean,
        ),
    ),
  );
}

export function parseOwnerProfileInput(
  input: OwnerProfileInput,
) {
  return {
    name:
      parseName(
        input.name,
      ),
  };
}

export function parseChangeOwnerPasswordInput(
  input: ChangeOwnerPasswordInput,
) {
  const currentPassword =
    input.currentPassword;

  if (
    !currentPassword
  ) {
    throw new SettingsValidationError(
      "Password saat ini wajib diisi.",
    );
  }

  const newPassword =
    parseNewPassword(
      input.newPassword,
    );

  if (
    newPassword !==
    input.confirmPassword
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

export function parseCreateOperatorInput(
  input: CreateOperatorInput,
) {
  return {
    name:
      parseName(
        input.name,
      ),

    email:
      parseEmail(
        input.email,
      ),

    password:
      parseNewPassword(
        input.password,
      ),

    kandangIds:
      parseKandangIds(
        input.kandangIds,
      ),
  };
}

export function parseUpdateOperatorAssignmentsInput(
  input: UpdateOperatorAssignmentsInput,
) {
  return {
    operatorId:
      parseId(
        input.operatorId,
        "Operator",
      ),

    kandangIds:
      parseKandangIds(
        input.kandangIds,
      ),
  };
}

export function parseSetOperatorActiveInput(
  input: SetOperatorActiveInput,
) {
  if (
    typeof input.isActive !==
    "boolean"
  ) {
    throw new SettingsValidationError(
      "Status Operator tidak valid.",
    );
  }

  return {
    operatorId:
      parseId(
        input.operatorId,
        "Operator",
      ),

    isActive:
      input.isActive,
  };
}

export function parseResetOperatorPasswordInput(
  input: ResetOperatorPasswordInput,
) {
  const newPassword =
    parseNewPassword(
      input.newPassword,
    );

  if (
    newPassword !==
    input.confirmPassword
  ) {
    throw new SettingsValidationError(
      "Konfirmasi password tidak sama.",
    );
  }

  return {
    operatorId:
      parseId(
        input.operatorId,
        "Operator",
      ),

    newPassword,
  };
}