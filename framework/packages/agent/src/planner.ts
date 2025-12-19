import { AgentExecutor } from "./executor.js";

export type PlanStep = {
  id: string;
  description: string;
  status: "pending" | "completed" | "skipped" | "failed";
  result?: unknown;
};

export type PlanRequest = {
  objective: string;
  steps?: string[];
  outputSchema?: Record<string, unknown>;
};

export type PlanResult = {
  objective: string;
  steps: PlanStep[];
};

export class Planner {
  constructor(private readonly executor: AgentExecutor) {}

  async plan(request: PlanRequest): Promise<PlanResult> {
    const steps = (request.steps ?? ["Analyse", "Reason", "Summarize"]).map<PlanStep>((description, index) => ({
      id: `step-${index + 1}`,
      description,
      status: "pending"
    }));

    return { objective: request.objective, steps };
  }
}
