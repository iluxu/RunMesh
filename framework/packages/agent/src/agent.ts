import { createOpenAI } from "@runmesh/core";
import { MemoryAdapter } from "@runmesh/memory";
import { ToolRegistry } from "@runmesh/tools";
import { AgentExecutor, AgentRunResult, AgentExecutionConfig } from "./executor.js";
import { Planner, PlanRequest } from "./planner.js";
import { Policy } from "./policies.js";

export type AgentConfig = {
  name: string;
  model: string;
  systemPrompt?: string;
  tools?: ToolRegistry;
  memory?: MemoryAdapter;
  policies?: Policy[];
};

export class Agent {
  private readonly executor: AgentExecutor;
  private readonly planner: Planner;

  constructor(private readonly config: AgentConfig) {
    const client = createOpenAI({ defaultModel: config.model });
    const executionConfig: AgentExecutionConfig = {
      ...config,
      client
    };
    this.executor = new AgentExecutor(executionConfig);
    this.planner = new Planner(this.executor);
  }

  async run(prompt: string): Promise<AgentRunResult> {
    return this.executor.run(prompt);
  }

  async plan(request: PlanRequest) {
    return this.planner.plan(request);
  }

  stream(prompt: string) {
    return this.executor.stream(prompt);
  }
}

export function createAgent(config: AgentConfig): Agent {
  return new Agent(config);
}
