import {
  UserRole,
} from "@/generated/prisma/enums";

import {
  parseDateOnly,
} from "@/features/daily-operations/utils/date";

import {
  buildReportWorkbook,
} from "@/features/reports/excel/build-report-workbook";

import {
  getReportExportDataForPeriod,
} from "@/features/reports/queries/get-report-export-data";

import {
  requireRole,
} from "@/server/auth/guards";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type ValidatedBusinessDate = {
  value: string;
  date: Date;
};

function parseStrictBusinessDate(
  value: string | null,
): ValidatedBusinessDate | null {
  if (
    !value ||
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    return null;
  }

  const [
    yearText,
    monthText,
    dayText,
  ] = value.split("-");

  const year =
    Number(yearText);

  const month =
    Number(monthText);

  const day =
    Number(dayText);

  const verificationDate =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
      ),
    );

  if (
    verificationDate.getUTCFullYear() !==
      year ||
    verificationDate.getUTCMonth() !==
      month - 1 ||
    verificationDate.getUTCDate() !==
      day
  ) {
    return null;
  }

  try {
    return {
      value,
      date:
        parseDateOnly(
          value,
        ),
    };
  } catch {
    return null;
  }
}

function errorResponse(
  message: string,
  status: number,
): Response {
  return new Response(
    message,
    {
      status,

      headers: {
        "Content-Type":
          "text/plain; charset=utf-8",

        "Cache-Control":
          "no-store",
      },
    },
  );
}

export async function GET(
  request: Request,
): Promise<Response> {
  try {
    /*
     * Security tetap dilakukan langsung
     * pada endpoint export.
     */
    await requireRole(
      UserRole.OWNER,
    );

    const url =
      new URL(
        request.url,
      );

    const from =
      parseStrictBusinessDate(
        url.searchParams.get(
          "from",
        ),
      );

    const to =
      parseStrictBusinessDate(
        url.searchParams.get(
          "to",
        ),
      );

    if (
      !from ||
      !to
    ) {
      return errorResponse(
        "Parameter from dan to wajib berupa tanggal YYYY-MM-DD yang valid.",
        400,
      );
    }

    if (
      from.date >
      to.date
    ) {
      return errorResponse(
        "Tanggal awal tidak boleh setelah tanggal akhir.",
        400,
      );
    }

    const data =
      await getReportExportDataForPeriod(
        from.date,
        to.date,
      );

    const workbookBuffer =
      await buildReportWorkbook(
        data,
      );

    const filename =
      `udinfarm-report-${from.value}_${to.value}.xlsx`;

    return new Response(
      workbookBuffer as unknown as BodyInit,
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

          "Content-Disposition":
            `attachment; filename="${filename}"`,

          "Cache-Control":
            "no-store",
        },
      },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "UNAUTHENTICATED"
    ) {
      return errorResponse(
        "Authentication required.",
        401,
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "FORBIDDEN"
    ) {
      return errorResponse(
        "Akses ditolak.",
        403,
      );
    }

    console.error(
      "Report Excel export failed.",
      error,
    );

    return errorResponse(
      "Gagal membuat laporan Excel.",
      500,
    );
  }
}