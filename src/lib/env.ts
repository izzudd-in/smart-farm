type NodeEnvironment =
  | "development"
  | "test"
  | "production";

function requireEnvironmentVariable(
  name: "DATABASE_URL" | "AUTH_SECRET",
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

function resolveNodeEnvironment(): NodeEnvironment {
  const value =
    process.env.NODE_ENV;

  if (!value) {
    return "development";
  }

  if (
    value === "development" ||
    value === "test" ||
    value === "production"
  ) {
    return value;
  }

  throw new Error(
    "NODE_ENV must be development, test, or production.",
  );
}

const databaseUrl =
  requireEnvironmentVariable(
    "DATABASE_URL",
  );

const authSecret =
  requireEnvironmentVariable(
    "AUTH_SECRET",
  );

if (
  authSecret.length < 32
) {
  throw new Error(
    "AUTH_SECRET must be at least 32 characters.",
  );
}

const nodeEnv =
  resolveNodeEnvironment();

export const env = Object.freeze({
  DATABASE_URL:
    databaseUrl,

  AUTH_SECRET:
    authSecret,

  NODE_ENV:
    nodeEnv,

  IS_PRODUCTION:
    nodeEnv === "production",
});