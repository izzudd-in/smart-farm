import { NextResponse } from "next/server";
import { UserRole } from "@/generated/prisma/enums";
import { requireRole } from "@/server/auth/guards";
import { parseDateOnly } from "@/features/daily-operations/utils/date";
import { getReportSummaryForPeriod } from "@/features/reports/queries/get-report-summary";
import {
  parseReportFilters,
  ReportFilterValidationError,
} from "@/features/reports/schemas/report-filter";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireRole(UserRole.OWNER);

    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const presetParam = searchParams.get("preset");

    const filters = parseReportFilters({
      from: fromParam,
      to: toParam,
      preset: presetParam,
    });

    const from = parseDateOnly(filters.from);
    const to = parseDateOnly(filters.to);

    const data = await getReportSummaryForPeriod(from, to);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHENTICATED") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "UNAUTHENTICATED",
              message: "Autentikasi diperlukan.",
            },
          },
          { status: 401 },
        );
      }

      if (error.message === "FORBIDDEN") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Anda tidak memiliki akses ke laporan manajemen.",
            },
          },
          { status: 403 },
        );
      }

      if (error instanceof ReportFilterValidationError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "BAD_REQUEST",
              message: error.message,
            },
          },
          { status: 400 },
        );
      }
    }

    console.error("API GET /api/reports/summary error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal memuat ringkasan laporan.",
        },
      },
      { status: 500 },
    );
  }
}
