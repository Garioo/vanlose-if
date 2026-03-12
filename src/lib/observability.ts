import * as Sentry from "@sentry/nextjs";

type Context = Record<string, unknown>;

export function captureApiError(error: unknown, context?: Context) {
  if (!error) return;

  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext("api", context);
    }
    Sentry.captureMessage("api_5xx", "error");
    Sentry.captureException(error);
  });
}

export function captureApiMessage(
  message: string,
  level: "info" | "warning" | "error" = "warning",
  context?: Context,
) {
  if (context) {
    Sentry.withScope((scope) => {
      scope.setContext("api", context);
      Sentry.captureMessage(message, level);
    });
    return;
  }

  Sentry.captureMessage(message, level);
}
