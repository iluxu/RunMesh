import { StructuredLogger } from "./logger.js";

export type TraceStep = {
  id: string;
  type: "model" | "tool" | "memory";
  detail: Record<string, unknown>;
  timestamp: number;
};

export type Trace = {
  runId: string;
  agent: string;
  steps: TraceStep[];
  tokensIn?: number;
  tokensOut?: number;
  cost?: number;
  durationMs?: number;
  errors?: unknown[];
};

export class Tracer {
  private readonly steps: TraceStep[] = [];
  private readonly errors: unknown[] = [];
  private start = performance.now();

  constructor(
    private readonly runId: string,
    private readonly agent: string,
    private readonly logger?: StructuredLogger
  ) {}

  addStep(step: Omit<TraceStep, "timestamp">) {
    const traceStep = { ...step, timestamp: Date.now() };
    this.steps.push(traceStep);
    this.logger?.debug("trace_step", traceStep);
  }

  recordError(error: unknown) {
    this.errors.push(error);
    this.logger?.error("trace_error", { error });
  }

  finalize(metadata?: Partial<Trace>): Trace {
    const durationMs = performance.now() - this.start;
    const trace: Trace = {
      runId: this.runId,
      agent: this.agent,
      steps: this.steps,
      errors: this.errors,
      durationMs,
      ...metadata
    };
    this.logger?.info("trace_complete", trace);
    return trace;
  }
}
