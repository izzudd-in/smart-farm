import {
  prisma,
} from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control":
    "no-store",
};

export async function GET() {
  try {
    /*
     * Connectivity check saja.
     * Tidak membaca business table.
     */
    await prisma.$queryRaw`SELECT 1`;

    return Response.json(
      {
        status:
          "ok",
      },
      {
        status:
          200,

        headers:
          NO_STORE_HEADERS,
      },
    );
  } catch (error) {
    /*
     * Tidak mengembalikan Prisma error,
     * connection string, SQL detail,
     * maupun stack trace ke client.
     */
    logger.error("Health check failed.", {
      action: "healthCheck",
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    });

    return Response.json(
      {
        status:
          "unavailable",
      },
      {
        status:
          503,

        headers:
          NO_STORE_HEADERS,
      },
    );
  }
}