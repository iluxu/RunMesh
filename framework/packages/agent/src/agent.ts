import { createOpenAI, RunMeshOpenAI } from "@runmesh/core";
import { MemoryAdapter } from "@runmesh/memory";
import { ToolRegistry } from "@runmesh/tools";
import { AgentExecutor, AgentRunResult, AgentExecutionConfig } from "./executor.js";
import { Planner, PlanRequest } from "./planner.js";
import { Policy } from "./policies.js";

export type AgentConfig = {
  name: string;
  model?: string;
  client?: RunMeshOpenAI;
  systemPrompt?: string;
  tools?: ToolRegistry;
  memory?: MemoryAdapter;
  policies?: Policy[];
};

export class Agent {
  private readonly executor: AgentExecutor;
  private readonly planner: Planner;

  constructor(private readonly config: AgentConfig) {
    // Use provided client or create a new one
    const client = config.client || createOpenAI({ defaultModel: config.model || "gpt-4o" });
    const executionConfig: AgentExecutionConfig = {
      name: config.name,
      model: config.model,
      systemPrompt: config.systemPrompt,
      tools: config.tools,
      memory: config.memory,
      policies: config.policies,
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
