import { AgentExecutor } from "./executor.js";

export type PlanStep = {
  id: string;
  description: string;
  status: "pending" | "completed" | "skipped" | "failed";
  result?: unknown;
  error?: string;
};

export type PlanRequest = {
  objective: string;
  steps?: string[];
  outputSchema?: Record<string, unknown>;
  continueOnError?: boolean;
};

export type PlanResult = {
  objective: string;
  steps: PlanStep[];
  success: boolean;
};

export type PlanExecutionOptions = {
  onStepStart?: (step: PlanStep) => void | Promise<void>;
  onStepComplete?: (step: PlanStep) => void | Promise<void>;
  onStepError?: (step: PlanStep, error: Error) => void | Promise<void>;
};

/**
 * Planner orchestrates multi-step execution using an AgentExecutor
 */
export class Planner {
  constructor(private readonly executor: AgentExecutor) {}

  /**
   * Creates a plan with pending steps but does not execute
   */
  async plan(request: PlanRequest): Promise<PlanResult> {
    const steps = this.createSteps(request);
    return { objective: request.objective, steps, success: false };
  }

  /**
   * Creates and executes a plan, running each step in sequence
   */
  async execute(request: PlanRequest, options: PlanExecutionOptions = {}): Promise<PlanResult> {
    const steps = this.createSteps(request);
    const continueOnError = request.continueOnError ?? false;
    let allSucceeded = true;

    for (const step of steps) {
      try {
        if (options.onStepStart) {
          await options.onStepStart(step);
        }

        step.status = "pending";

        // Build prompt with context from previous steps
        const prompt = this.buildStepPrompt(request.objective, step, steps);

        // Execute this step using the agent executor
        const result = await this.executor.run(prompt);

        // Extract the response content as the step result
        const content = result.response.choices[0]?.message?.content;
        step.result = content || result;
        step.status = "completed";

        if (options.onStepComplete) {
          await options.onStepComplete(step);
        }
      } catch (error) {
        step.status = "failed";
        step.error = error instanceof Error ? error.message : String(error);
        allSucceeded = false;

        if (options.onStepError) {
          await options.onStepError(
            step,
            error instanceof Error ? error : new Error(String(error))
          );
        }

        if (!continueOnError) {
          // Mark remaining steps as skipped
          const remainingSteps = steps.slice(steps.indexOf(step) + 1);
          for (const remaining of remainingSteps) {
            remaining.status = "skipped";
          }
          break;
        }
      }
    }

    return {
      objective: request.objective,
      steps,
      success: allSucceeded
    };
  }

  private createSteps(request: PlanRequest): PlanStep[] {
    const stepDescriptions = request.steps ?? [
      "Analyze the objective and gather relevant information",
      "Reason about the best approach to achieve the objective",
      "Summarize findings and provide a conclusion"
    ];

    return stepDescriptions.map<PlanStep>((description, index) => ({
      id: `step-${index + 1}`,
      description,
      status: "pending"
    }));
  }

  private buildStepPrompt(objective: string, currentStep: PlanStep, allSteps: PlanStep[]): string {
    const parts = [`Objective: ${objective}`, "", `Current Step: ${currentStep.description}`];

    // Include results from completed steps as context
    const completedSteps = allSteps.filter(
      (s) => s.status === "completed" && allSteps.indexOf(s) < allSteps.indexOf(currentStep)
    );

    if (completedSteps.length > 0) {
      parts.push("", "Context from previous steps:");
      for (const step of completedSteps) {
        parts.push(`- ${step.description}: ${this.formatStepResult(step.result)}`);
      }
    }

    parts.push("", "Please complete this step and provide a clear response.");

    return parts.join("\n");
  }

  private formatStepResult(result: unknown): string {
    if (typeof result === "string") {
      return result.length > 200 ? result.substring(0, 200) + "..." : result;
    }
    if (typeof result === "object" && result !== null) {
      const json = JSON.stringify(result);
      return json.length > 200 ? json.substring(0, 200) + "..." : json;
    }
    return String(result);
  }
}
