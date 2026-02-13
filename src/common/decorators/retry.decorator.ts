export interface RetryOptions {
  maxRetries: number | ((context: any) => number);
  onRetry?: (context: any, attempt: number, error: Error) => void;
}

export function Retry(options: RetryOptions): MethodDecorator {
  return function (
    _target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value as (...args: any[]) => Promise<unknown>;

    descriptor.value = async function (this: any, ...args: any[]): Promise<unknown> {
      const maxRetries =
        typeof options.maxRetries === "function"
          ? options.maxRetries(this)
          : options.maxRetries;

      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error: unknown) {
          lastError = error instanceof Error ? error : new Error(String(error));

          if (attempt < maxRetries) {
            options.onRetry?.(this, attempt + 1, lastError);
          }
        }
      }

      throw lastError;
    };

    return descriptor;
  };
}
