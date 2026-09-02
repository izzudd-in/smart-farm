import { NextResponse } from "next/server";
import { UserRole } from "@/generated/prisma/enums";
import { getProductionKandangDetail } from "@/features/production/queries/get-production-kandang-detail";
import { parseProductionFilters } from "@/features/production/schemas/production-filter";
import { requireRole } from "@/server/auth/guards";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{
    kandangId: string;
  }>;
};

export async function GET(request: Request, context: RouteParams) {
  try {
    await requireRole([UserRole.OWNER, UserRole.OPERATOR]);

    const { kandangId } = await context.params;
    const { searchParams } = new URL(request.url);

    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;
    const flock = searchParams.get("flock") ?? "";
    const mode = searchParams.get("mode") ?? undefined;

    const filters = parseProductionFilters({
      from,
      to,
      kandangId,
      mode,
    });

    const data = await getProductionKandangDetail(kandangId, filters, flock);

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Kandang tidak ditemukan.",
          },
        },
        { status: 404 },
      );
    }

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
              message: "Anda tidak memiliki akses ke detail produksi kandang ini.",
            },
          },
          { status: 403 },
        );
      }
    }

    console.error("API GET /api/production/[kandangId] error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal memuat detail produksi kandang.",
        },
      },
      { status: 500 },
    );
  }
}
