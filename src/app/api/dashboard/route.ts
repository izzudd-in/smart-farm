import { NextResponse } from "next/server";
import { UserRole } from "@/generated/prisma/enums";
import { requireRole } from "@/server/auth/guards";
import { getDashboardOverview } from "@/features/dashboard/queries/get-dashboard-overview";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole(UserRole.OWNER);

    const data = await getDashboardOverview();

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
              message: "Anda tidak memiliki akses ke dashboard manajemen.",
            },
          },
          { status: 403 },
        );
      }
    }

    console.error("API GET /api/dashboard error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal memuat data dashboard.",
        },
      },
      { status: 500 },
    );
  }
}
