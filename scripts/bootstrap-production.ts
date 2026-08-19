import "dotenv/config";

import {
  PrismaPg,
} from "@prisma/adapter-pg";

import {
  PrismaClient,
} from "../src/generated/prisma/client";

import {
  UserRole,
} from "../src/generated/prisma/enums";

import {
  hashPassword,
} from "../src/lib/auth/password";

function required(
  name:
    | "DATABASE_URL"
    | "INITIAL_FARM_NAME"
    | "INITIAL_OWNER_NAME"
    | "INITIAL_OWNER_EMAIL"
    | "INITIAL_OWNER_PASSWORD",
): string {
  const value =
    process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `${name} is not configured.`,
    );
  }

  return value;
}

const databaseUrl =
  required(
    "DATABASE_URL",
  );

const farmName =
  required(
    "INITIAL_FARM_NAME",
  );

const ownerName =
  required(
    "INITIAL_OWNER_NAME",
  );

const ownerEmail =
  required(
    "INITIAL_OWNER_EMAIL",
  ).toLowerCase();

const ownerPassword =
  required(
    "INITIAL_OWNER_PASSWORD",
  );

if (
  ownerName.length < 2 ||
  ownerName.length > 100
) {
  throw new Error(
    "INITIAL_OWNER_NAME must be 2-100 characters.",
  );
}

if (
  ownerPassword.length < 8
) {
  throw new Error(
    "INITIAL_OWNER_PASSWORD must be at least 8 characters.",
  );
}

if (
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    ownerEmail,
  )
) {
  throw new Error(
    "INITIAL_OWNER_EMAIL is invalid.",
  );
}

const adapter =
  new PrismaPg({
    connectionString:
      databaseUrl,
  });

const prisma =
  new PrismaClient({
    adapter,
  });

async function main() {
  let farmCreated =
    false;

  let ownerCreated =
    false;

  await prisma.$transaction(
    async (
      tx,
    ) => {
      const existingFarm =
        await tx.farm.findUnique({
          where: {
            scope:
              "PRIMARY",
          },

          select: {
            id:
              true,
          },
        });

      if (
        !existingFarm
      ) {
        await tx.farm.create({
          data: {
            scope:
              "PRIMARY",

            code:
              "PRIMARY",

            name:
              farmName,

            isActive:
              true,
          },
        });

        farmCreated =
          true;
      }

      const existingOwner =
        await tx.user.findFirst({
          where: {
            role:
              UserRole.OWNER,
          },

          select: {
            id:
              true,
          },
        });

      if (
        existingOwner
      ) {
        return;
      }

      const conflictingEmail =
        await tx.user.findUnique({
          where: {
            email:
              ownerEmail,
          },

          select: {
            id:
              true,
          },
        });

      if (
        conflictingEmail
      ) {
        throw new Error(
          "INITIAL_OWNER_EMAIL is already used by another account.",
        );
      }

      const passwordHash =
        await hashPassword(
          ownerPassword,
        );

      await tx.user.create({
        data: {
          name:
            ownerName,

          email:
            ownerEmail,

          passwordHash,

          role:
            UserRole.OWNER,

          isActive:
            true,
        },
      });

      ownerCreated =
        true;
    },
  );

  if (
    !farmCreated &&
    !ownerCreated
  ) {
    console.log(
      "Production bootstrap: nothing to create.",
    );

    return;
  }

  console.log(
    `Production bootstrap completed. Farm created: ${farmCreated ? "yes" : "no"}. Owner created: ${ownerCreated ? "yes" : "no"}.`,
  );
}

main()
  .catch(
    () => {
      console.error(
        "Production bootstrap failed.",
      );

      console.error(
        "Check required bootstrap environment, database connectivity, and migration status.",
      );

      process.exitCode =
        1;
    },
  )
  .finally(
    async () => {
      await prisma.$disconnect();
    },
  );