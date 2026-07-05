import { trace, SpanStatusCode, type Span } from "@opentelemetry/api";

export interface ErrorContext {
  service: string;
  operation: string;
  userId?: string;
  tenantId?: string;
  requestId?: string;
  [key: string]: unknown;
}

export function trackError(error: Error, context: ErrorContext): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
    span.recordException(error);
    span.setAttributes({
      "error.type": error.name,
      "error.message": error.message,
      "error.stack": error.stack ?? "",
      "service.name": context.service,
      "operation.name": context.operation,
      ...(context.userId && { "user.id": context.userId }),
      ...(context.tenantId && { "tenant.id": context.tenantId }),
      ...(context.requestId && { "request.id": context.requestId }),
    });
  }

  console.error(`[${context.service}] Error in ${context.operation}:`, {
    error: error.message,
    stack: error.stack,
    ...context,
  });
}

export function withErrorTracking<T>(
  context: ErrorContext,
  fn: () => T | Promise<T>,
): T | Promise<T> {
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.catch((error) => {
        trackError(
          error instanceof Error ? error : new Error(String(error)),
          context,
        );
        throw error;
      });
    }
    return result;
  } catch (error) {
    trackError(
      error instanceof Error ? error : new Error(String(error)),
      context,
    );
    throw error;
  }
}
