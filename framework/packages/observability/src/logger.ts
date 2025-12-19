export type LogLevel = "debug" | "info" | "warn" | "error";

export interface StructuredLogger {
  log(level: LogLevel, message: string, meta?: Record<string, unknown>): void;
  debug?(message: string, meta?: Record<string, unknown>): void;
  info?(message: string, meta?: Record<string, unknown>): void;
  warn?(message: string, meta?: Record<string, unknown>): void;
  error?(message: string, meta?: Record<string, unknown>): void;
}

export class ConsoleLogger implements StructuredLogger {
  constructor(private readonly scope?: string) {}

  log(level: LogLevel, message: string, meta: Record<string, unknown> = {}): void {
    const payload = { level, scope: this.scope, message, ...meta };
    // Keep logging small and predictable for easy piping to JSONL if desired.
    console.log(JSON.stringify(payload));
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.log("info", message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>) {
    this.log("debug", message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.log("warn", message, meta);
  }

  error(message: string, meta?: Record<string, unknown>) {
    this.log("error", message, meta);
  }
}
