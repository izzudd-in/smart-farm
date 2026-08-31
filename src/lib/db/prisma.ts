import { Pool } from "pg";
import {
  PrismaPg,
} from "@prisma/adapter-pg";

import {
  PrismaClient,
} from "@/generated/prisma/client";

import {
  env,
} from "@/lib/env";

const globalForPrisma =
  globalThis as unknown as {
    prisma:
      | PrismaClient
      | undefined;
  };

function createPrismaClient() {
  const pool = new Pool({
    connectionString:
      env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  const adapter =
    new PrismaPg(pool);

  return new PrismaClient({
    adapter,
  });
}

export const prisma =
  globalForPrisma.prisma ??
  createPrismaClient();

if (
  !env.IS_PRODUCTION
) {
  globalForPrisma.prisma =
    prisma;
}