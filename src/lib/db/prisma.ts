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
    pool:
      | Pool
      | undefined;
  };

function getPool(): Pool {
  if (globalForPrisma.pool) {
    return globalForPrisma.pool;
  }

  const pool = new Pool({
    connectionString:
      env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  });

  // Handle errors on idle connections to prevent unhandled crashes
  pool.on("error", (err) => {
    console.warn("Unexpected error on idle pg pool client:", err.message);
  });

  if (!env.IS_PRODUCTION) {
    globalForPrisma.pool = pool;
  }

  return pool;
}

function createPrismaClient() {
  const pool = getPool();

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