import { RegisteredTool } from "./tool.js";

export class ToolRegistry {
  private readonly tools = new Map<string, RegisteredTool>();

  register(tool: RegisteredTool): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): RegisteredTool | undefined {
    return this.tools.get(name);
  }

  list(): RegisteredTool[] {
    return Array.from(this.tools.values());
  }

  toOpenAITools() {
    return this.list().map((tool) => tool.toOpenAITool());
  }
}
