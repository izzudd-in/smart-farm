import { NextResponse } from "next/server";
import { UserRole } from "@/generated/prisma/enums";
import { getProductionPageData } from "@/features/production/queries/get-production-page-data";
import { parseProductionFilters } from "@/features/production/schemas/production-filter";
import { requireRole } from "@/server/auth/guards";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireRole([UserRole.OWNER, UserRole.OPERATOR]);

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;
    const kandangId = searchParams.get("kandangId") ?? searchParams.get("kandang") ?? undefined;
    const mode = searchParams.get("mode") ?? undefined;

    const filters = parseProductionFilters({
      from,
      to,
      kandangId,
      mode,
    });

    const data = await getProductionPageData(filters);

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
              message: "Anda tidak memiliki akses ke data produksi.",
            },
          },
          { status: 403 },
        );
      }
    }

    console.error("API GET /api/production error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal memuat data produksi.",
        },
      },
      { status: 500 },
    );
  }
}
