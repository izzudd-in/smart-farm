"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  UserRole,
} from "@/generated/prisma/enums";

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
  parseOwnerProfileInput,
  SettingsValidationError,
} from "@/features/settings/schemas/settings";

import type {
  ChangeOwnerPasswordInput,
  OwnerProfileInput,
  SettingsActionResult,
} from "@/features/settings/types/settings";

const SETTINGS_PATH =
  "/settings";

const DASHBOARD_PATH =
  "/dashboard";

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

  console.error(
    "Settings action failed.",
    error instanceof Error
      ? {
          name:
            error.name,
          message:
            error.message,
        }
      : {
          name:
            "UnknownError",
        },
  );

  return {
    success:
      false,

    error:
      "Terjadi kesalahan. Silakan coba lagi.",
  };
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

    /*
     * /settings di-refresh sebagai halaman akun.
     * /dashboard juga direvalidate karena Owner shell
     * tampil pada area tersebut dan menerima nama
     * current user dari server.
     *
     * Client juga menjalankan router.refresh()
     * setelah action sukses sehingga shell aktif
     * memperoleh AuthUser terbaru.
     */
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

    /*
     * passwordHash hanya dibaca di action ini.
     * Nilai tersebut tidak pernah dikirim ke Client
     * Component atau dimasukkan ke action result.
     */
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

    /*
     * Compare terhadap hash current memastikan
     * password baru benar-benar berbeda dari password
     * yang tersimpan, bukan hanya berbeda dari string
     * currentPassword yang dikirim client.
     */
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

    /*
     * Session registry/revocation sengaja tidak
     * ditambahkan. Existing signed HttpOnly session
     * dapat tetap berjalan.
     */
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