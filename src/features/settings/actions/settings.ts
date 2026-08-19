"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  UserRole,
} from "@/generated/prisma/enums";

import type {
  Prisma,
} from "@/generated/prisma/client";

import {
  hashPassword,
  verifyPassword,
} from "@/lib/auth/password";

import {
  prisma,
} from "@/lib/db/prisma";

import {
  requireRole,
} from "@/server/auth/guards";

import {
  parseChangeOwnerPasswordInput,
  parseCreateOperatorInput,
  parseOwnerProfileInput,
  parseResetOperatorPasswordInput,
  parseSetOperatorActiveInput,
  parseUpdateOperatorAssignmentsInput,
  SettingsValidationError,
} from "@/features/settings/schemas/settings";

import type {
  ChangeOwnerPasswordInput,
  CreateOperatorInput,
  OwnerProfileInput,
  ResetOperatorPasswordInput,
  SetOperatorActiveInput,
  SettingsActionResult,
  UpdateOperatorAssignmentsInput,
} from "@/features/settings/types/settings";

const SETTINGS_PATH =
  "/settings";

const DASHBOARD_PATH =
  "/dashboard";

const OWNER_DAILY_PATH =
  "/daily";

const OPERATOR_TODAY_PATH =
  "/operator/today";

function ruleError(
  message: string,
): Error {
  return new Error(
    `SETTINGS_RULE:${message}`,
  );
}

function databaseErrorCode(
  error: unknown,
): string | null {
  if (
    typeof error ===
      "object" &&
    error !==
      null &&
    "code" in
      error &&
    typeof error.code ===
      "string"
  ) {
    return error.code;
  }

  return null;
}

function handleSettingsError(
  error: unknown,
): SettingsActionResult {
  if (
    error instanceof
    SettingsValidationError
  ) {
    return {
      success:
        false,

      error:
        error.message,
    };
  }

  if (
    error instanceof Error &&
    error.message.startsWith(
      "SETTINGS_RULE:",
    )
  ) {
    return {
      success:
        false,

      error:
        error.message.replace(
          "SETTINGS_RULE:",
          "",
        ),
    };
  }

  if (
    error instanceof Error &&
    [
      "UNAUTHENTICATED",
      "FORBIDDEN",
    ].includes(
      error.message,
    )
  ) {
    return {
      success:
        false,

      error:
        "Akses ditolak.",
    };
  }

  if (
    databaseErrorCode(
      error,
    ) === "P2002"
  ) {
    return {
      success:
        false,

      error:
        "Email sudah digunakan.",
    };
  }

  /*
   * Log server-side tanpa password/input
   * dan tanpa mengirim raw Prisma error
   * ke browser.
   */
  console.error(
    "Settings action failed.",
    {
      name:
        error instanceof Error
          ? error.name
          : "UnknownError",

      code:
        databaseErrorCode(
          error,
        ),
    },
  );

  return {
    success:
      false,

    error:
      "Terjadi kesalahan. Silakan coba lagi.",
  };
}

function revalidateOperatorManagement() {
  revalidatePath(
    SETTINGS_PATH,
  );

  revalidatePath(
    OWNER_DAILY_PATH,
  );

  revalidatePath(
    OPERATOR_TODAY_PATH,
  );
}

async function getActiveAssignmentKandangs(
  tx: Prisma.TransactionClient,
  kandangIds: string[],
): Promise<
  {
    id: string;
  }[]
> {
  if (
    kandangIds.length ===
    0
  ) {
    return [];
  }

  const kandangs =
    await tx.kandang.findMany({
      where: {
        id: {
          in:
            kandangIds,
        },

        isActive:
          true,

        farm: {
          scope:
            "PRIMARY",
        },
      },

      select: {
        id:
          true,
      },
    });

  if (
    kandangs.length !==
    kandangIds.length
  ) {
    throw ruleError(
      "Assignment hanya boleh menggunakan kandang aktif milik farm utama.",
    );
  }

  return kandangs;
}

async function assertOperatorTarget(
  tx: Prisma.TransactionClient,
  operatorId: string,
) {
  const operator =
    await tx.user.findFirst({
      where: {
        id:
          operatorId,

        role:
          UserRole.OPERATOR,
      },

      select: {
        id:
          true,

        isActive:
          true,
      },
    });

  if (!operator) {
    throw ruleError(
      "Operator tidak ditemukan.",
    );
  }

  return operator;
}

export async function updateOwnerProfile(
  input: OwnerProfileInput,
): Promise<SettingsActionResult> {
  try {
    const user =
      await requireRole(
        UserRole.OWNER,
      );

    const parsed =
      parseOwnerProfileInput(
        input,
      );

    const updated =
      await prisma.user.updateMany({
        where: {
          id:
            user.id,

          role:
            UserRole.OWNER,

          isActive:
            true,
        },

        data: {
          name:
            parsed.name,
        },
      });

    if (
      updated.count !== 1
    ) {
      throw new Error(
        "FORBIDDEN",
      );
    }

    revalidatePath(
      SETTINGS_PATH,
    );

    revalidatePath(
      DASHBOARD_PATH,
    );

    return {
      success:
        true,

      message:
        "Profil berhasil diperbarui.",
    };
  } catch (error) {
    return handleSettingsError(
      error,
    );
  }
}

export async function changeOwnerPassword(
  input: ChangeOwnerPasswordInput,
): Promise<SettingsActionResult> {
  try {
    const sessionUser =
      await requireRole(
        UserRole.OWNER,
      );

    const parsed =
      parseChangeOwnerPasswordInput(
        input,
      );

    const user =
      await prisma.user.findFirst({
        where: {
          id:
            sessionUser.id,

          role:
            UserRole.OWNER,

          isActive:
            true,
        },

        select: {
          id:
            true,

          passwordHash:
            true,
        },
      });

    if (!user) {
      throw new Error(
        "FORBIDDEN",
      );
    }

    const currentPasswordValid =
      await verifyPassword(
        parsed.currentPassword,
        user.passwordHash,
      );

    if (
      !currentPasswordValid
    ) {
      return {
        success:
          false,

        error:
          "Password saat ini tidak sesuai.",
      };
    }

    const sameAsCurrent =
      await verifyPassword(
        parsed.newPassword,
        user.passwordHash,
      );

    if (
      sameAsCurrent
    ) {
      return {
        success:
          false,

        error:
          "Password baru harus berbeda dari password saat ini.",
      };
    }

    const passwordHash =
      await hashPassword(
        parsed.newPassword,
      );

    const updated =
      await prisma.user.updateMany({
        where: {
          id:
            user.id,

          role:
            UserRole.OWNER,

          isActive:
            true,
        },

        data: {
          passwordHash,
        },
      });

    if (
      updated.count !== 1
    ) {
      throw new Error(
        "FORBIDDEN",
      );
    }

    revalidatePath(
      SETTINGS_PATH,
    );

    return {
      success:
        true,

      message:
        "Password berhasil diperbarui.",
    };
  } catch (error) {
    return handleSettingsError(
      error,
    );
  }
}

export async function createOperator(
  input: CreateOperatorInput,
): Promise<SettingsActionResult> {
  try {
    await requireRole(
      UserRole.OWNER,
    );

    const parsed =
      parseCreateOperatorInput(
        input,
      );

    const passwordHash =
      await hashPassword(
        parsed.password,
      );

    await prisma.$transaction(
      async (
        tx,
      ) => {
        const existing =
          await tx.user.findUnique({
            where: {
              email:
                parsed.email,
            },

            select: {
              id:
                true,
            },
          });

        if (
          existing
        ) {
          throw ruleError(
            "Email sudah digunakan.",
          );
        }

        const kandangs =
          await getActiveAssignmentKandangs(
            tx,
            parsed.kandangIds,
          );

        await tx.user.create({
          data: {
            name:
              parsed.name,

            email:
              parsed.email,

            passwordHash,

            role:
              UserRole.OPERATOR,

            isActive:
              true,

            kandangs:
              kandangs.length >
              0
                ? {
                    connect:
                      kandangs,
                  }
                : undefined,
          },
        });
      },
    );

    revalidateOperatorManagement();

    return {
      success:
        true,

      message:
        "Operator berhasil ditambahkan.",
    };
  } catch (error) {
    return handleSettingsError(
      error,
    );
  }
}

export async function updateOperatorAssignments(
  input: UpdateOperatorAssignmentsInput,
): Promise<SettingsActionResult> {
  try {
    await requireRole(
      UserRole.OWNER,
    );

    const parsed =
      parseUpdateOperatorAssignmentsInput(
        input,
      );

    await prisma.$transaction(
      async (
        tx,
      ) => {
        const operator =
          await assertOperatorTarget(
            tx,
            parsed.operatorId,
          );

        const kandangs =
          await getActiveAssignmentKandangs(
            tx,
            parsed.kandangIds,
          );

        /*
         * Hanya mengubah current many-to-many
         * assignment.
         *
         * DailyReport.operatorId historical
         * tidak disentuh.
         */
        await tx.user.update({
          where: {
            id:
              operator.id,
          },

          data: {
            kandangs: {
              set:
                kandangs,
            },
          },
        });
      },
    );

    revalidateOperatorManagement();

    return {
      success:
        true,

      message:
        "Assignment kandang berhasil diperbarui.",
    };
  } catch (error) {
    return handleSettingsError(
      error,
    );
  }
}

export async function setOperatorActive(
  input: SetOperatorActiveInput,
): Promise<SettingsActionResult> {
  try {
    await requireRole(
      UserRole.OWNER,
    );

    const parsed =
      parseSetOperatorActiveInput(
        input,
      );

    const updated =
      await prisma.user.updateMany({
        where: {
          id:
            parsed.operatorId,

          role:
            UserRole.OPERATOR,
        },

        data: {
          isActive:
            parsed.isActive,
        },
      });

    if (
      updated.count !==
      1
    ) {
      throw ruleError(
        "Operator tidak ditemukan.",
      );
    }

    /*
     * Assignment dan DailyReport historical
     * sengaja tetap dipertahankan.
     */
    revalidateOperatorManagement();

    return {
      success:
        true,

      message:
        parsed.isActive
          ? "Operator berhasil diaktifkan."
          : "Operator berhasil dinonaktifkan.",
    };
  } catch (error) {
    return handleSettingsError(
      error,
    );
  }
}

export async function resetOperatorPassword(
  input: ResetOperatorPasswordInput,
): Promise<SettingsActionResult> {
  try {
    await requireRole(
      UserRole.OWNER,
    );

    const parsed =
      parseResetOperatorPasswordInput(
        input,
      );

    const passwordHash =
      await hashPassword(
        parsed.newPassword,
      );

    const updated =
      await prisma.user.updateMany({
        where: {
          id:
            parsed.operatorId,

          role:
            UserRole.OPERATOR,
        },

        data: {
          passwordHash,
        },
      });

    if (
      updated.count !==
      1
    ) {
      throw ruleError(
        "Operator tidak ditemukan.",
      );
    }

    revalidatePath(
      SETTINGS_PATH,
    );

    return {
      success:
        true,

      message:
        "Password Operator berhasil diperbarui.",
    };
  } catch (error) {
    return handleSettingsError(
      error,
    );
  }
}