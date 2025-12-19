import { ToolError } from "@runmesh/core";
import { assertValid } from "@runmesh/schema";
import { RegisteredTool, ToolContext } from "./tool.js";

export class ToolExecutor {
  constructor(private readonly tools: Map<string, RegisteredTool>) {}

  static fromList(tools: RegisteredTool[]): ToolExecutor {
    return new ToolExecutor(new Map(tools.map((t) => [t.name, t])));
  }

  async execute(name: string, args: unknown, context: ToolContext = {}): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new ToolError(`Tool not found: ${name}`);
    }

    const input = assertValid(tool.schema, args);

    try {
      return await tool.handler(input, context);
    } catch (error) {
      throw new ToolError(`Tool execution failed: ${name}`, error);
    }
  }
}
