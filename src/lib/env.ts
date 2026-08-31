type NodeEnvironment =
  | "development"
  | "test"
  | "production";

function requireEnvironmentVariable(
  name: "DATABASE_URL" | "AUTH_SECRET" | "APP_URL",
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

function parseAppUrl(
  value: string,
): URL {
  let parsed: URL;

  try {
    parsed =
      new URL(value);
  } catch {
    throw new Error(
      "APP_URL must be an absolute http:// or https:// URL.",
    );
  }

  if (
    parsed.protocol !== "http:" &&
    parsed.protocol !== "https:"
  ) {
    throw new Error(
      "APP_URL must use http:// or https://.",
    );
  }

  if (
    parsed.username ||
    parsed.password
  ) {
    throw new Error(
      "APP_URL must not contain credentials.",
    );
  }

  if (
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(
      "APP_URL must be the application origin without a path, query, or hash.",
    );
  }

  return parsed;
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

const appUrl =
  parseAppUrl(
    requireEnvironmentVariable(
      "APP_URL",
    ),
  );

const nodeEnv =
  resolveNodeEnvironment();

export const env = Object.freeze({
  DATABASE_URL:
    databaseUrl,

  AUTH_SECRET:
    authSecret,

  APP_URL:
    appUrl.origin,

  IS_HTTPS:
    appUrl.protocol === "https:" ||
    nodeEnv === "production",

  NODE_ENV:
    nodeEnv,

  IS_PRODUCTION:
    nodeEnv === "production",
});