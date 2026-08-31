import { env } from "@/lib/env";

export type LogLevel = "info" | "warn" | "error";

export type LogContext = {
  userId?: string;
  route?: string;
  action?: string;
  metadata?: Record<string, unknown>;
};

class Logger {
  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext,
  ) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      environment: env.NODE_ENV,
      context,
    };
  }

  public info(message: string, context?: LogContext): void {
    const payload = this.formatMessage("info", message, context);
    console.info(JSON.stringify(payload));
  }

  public warn(message: string, context?: LogContext): void {
    const payload = this.formatMessage("warn", message, context);
    console.warn(JSON.stringify(payload));
  }

  public error(
    errorOrMessage: unknown,
    context?: LogContext,
  ): void {
    const errorMessage =
      errorOrMessage instanceof Error
        ? errorOrMessage.message
        : String(errorOrMessage);

    const errorStack =
      errorOrMessage instanceof Error ? errorOrMessage.stack : undefined;

    const payload = {
      ...this.formatMessage("error", errorMessage, context),
      stack: errorStack,
    };

    console.error(JSON.stringify(payload));

    // Optional external error tracking webhook / integration (e.g. Sentry / LogRocket / Custom webhook)
    const webhookUrl = process.env["LOG_WEBHOOK_URL"]?.trim();
    if (webhookUrl && env.IS_PRODUCTION) {
      try {
        fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch((webhookErr) => {
          console.error("External error logger webhook failed:", webhookErr);
        });
      } catch {
        // Non-blocking
      }
    }
  }

  public captureException(
    error: unknown,
    context?: LogContext,
  ): void {
    this.error(error, context);
  }
}

export const logger = new Logger();
