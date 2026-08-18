import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  await prisma.$queryRaw`SELECT 1`;

  const systemState = await prisma.systemState.findUnique({
    where: {
      key: "foundation",
    },
  });

  console.log("Database connection: OK");
  console.log("Foundation state:", systemState?.value ?? "not seeded");
}

main()
  .catch((error) => {
    console.error("Database connection: FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });