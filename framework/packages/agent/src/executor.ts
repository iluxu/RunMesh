import { RunMeshOpenAI, ChatMessage, ChatRequest, ChatResponse, ResponseStream } from "@runmesh/core";
import { MemoryAdapter } from "@runmesh/memory";
import { ToolExecutor, ToolRegistry } from "@runmesh/tools";
import { Policy, enforcePolicies } from "./policies.js";

export type AgentExecutionConfig = {
  name: string;
  systemPrompt?: string;
  model: string;
  client: RunMeshOpenAI;
  tools?: ToolRegistry;
  memory?: MemoryAdapter;
  policies?: Policy[];
  maxToolRounds?: number;
};

export type AgentRunResult = {
  response: ChatResponse;
  steps: AgentStep[];
};

export type AgentStep =
  | { type: "model"; request: ChatRequest; response: ChatResponse }
  | { type: "tool"; name: string; input: unknown; output: unknown };

export class AgentExecutor {
  private readonly toolExecutor: ToolExecutor | undefined;
  private readonly maxToolRounds: number;

  constructor(private readonly config: AgentExecutionConfig) {
    this.toolExecutor = config.tools ? ToolExecutor.fromList(config.tools.list()) : undefined;
    this.maxToolRounds = config.maxToolRounds ?? 5;
  }

  async run(prompt: string): Promise<AgentRunResult> {
    const steps: AgentStep[] = [];
    const messages = await this.buildMessages(prompt);

    await enforcePolicies(this.config.policies, { agent: this.config.name, messages });

    const request: ChatRequest = {
      model: this.config.model,
      messages,
      tools: this.config.tools?.toOpenAITools()
    };

    let response = await this.config.client.respond(request);
    steps.push({ type: "model", request, response });

    let rounds = 0;
    while (this.shouldUseTools(response)) {
      rounds += 1;
      this.pushAssistantWithToolCalls(messages, response);
      const toolSteps = await this.handleToolCalls(response, messages);
      steps.push(...toolSteps);

      if (rounds >= this.maxToolRounds) {
        break;
      }

      response = await this.config.client.respond({ ...request, messages });
      steps.push({ type: "model", request: { ...request, messages }, response });
    }

    const finalAssistant = response.choices[0]?.message;
    if (finalAssistant) {
      messages.push(finalAssistant);
    }

    await this.persistMessages(messages, response);
    return { response, steps };
  }

  async stream(prompt: string): Promise<ResponseStream> {
    const messages = await this.buildMessages(prompt);
    await enforcePolicies(this.config.policies, { agent: this.config.name, messages });

    const request: ChatRequest = {
      model: this.config.model,
      messages,
      tools: this.config.tools?.toOpenAITools()
    };

    return this.config.client.stream(request);
  }

  private pushAssistantWithToolCalls(messages: ChatMessage[], response: ChatResponse) {
    const assistantMessage = response.choices[0]?.message;
    if (assistantMessage) {
      messages.push(assistantMessage);
    }
  }

  private async buildMessages(prompt: string): Promise<ChatMessage[]> {
    const messages: ChatMessage[] = [];

    if (this.config.systemPrompt) {
      messages.push({ role: "system", content: this.config.systemPrompt });
    }

    if (this.config.memory) {
      const history = await this.config.memory.history(this.config.name);
      messages.push(...history);
    }

    messages.push({ role: "user", content: prompt });
    return messages;
  }

  private async handleToolCalls(response: ChatResponse, messages: ChatMessage[]): Promise<AgentStep[]> {
    if (!this.toolExecutor) return [];

    const steps: AgentStep[] = [];
    const calls = response.choices[0]?.message?.tool_calls ?? [];

    for (const call of calls) {
      if (call.type !== "function") continue;
      const input = call.function.arguments ? JSON.parse(call.function.arguments) : {};
      const output = await this.toolExecutor.execute(call.function.name, input, { runId: response.id });
      steps.push({ type: "tool", name: call.function.name, input, output });
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(output)
      });
    }

    return steps;
  }

  private shouldUseTools(response: ChatResponse): boolean {
    return Boolean(response.choices[0]?.message?.tool_calls?.length && this.toolExecutor);
  }

  private async persistMessages(messages: ChatMessage[], response: ChatResponse): Promise<void> {
    if (!this.config.memory) return;
    const lastUser = [...messages].reverse().find((msg) => msg.role === "user");
    if (lastUser) {
      await this.config.memory.add(this.config.name, lastUser);
    }
    const assistantMessage = response.choices[0]?.message ?? { role: "assistant", content: "" };
    await this.config.memory.add(this.config.name, assistantMessage);
  }
}
