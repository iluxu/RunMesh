import { ZodSchema } from "zod";
import { toJSONSchema } from "@runmesh/schema";

export type ToolContext = {
  runId?: string;
  metadata?: Record<string, unknown>;
};

export type ToolDefinition<TInput, TResult> = {
  name: string;
  description: string;
  schema: ZodSchema<TInput>;
  handler: (input: TInput, context: ToolContext) => Promise<TResult> | TResult;
};

export type ToolCallDefinition = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters: Record<string, unknown>;
  };
};

export type RegisteredTool<TInput = unknown, TResult = unknown> = ToolDefinition<TInput, TResult> & {
  toOpenAITool(): ToolCallDefinition;
};

export function tool<TInput, TResult>(definition: ToolDefinition<TInput, TResult>): RegisteredTool<TInput, TResult> {
  return {
    ...definition,
    toOpenAITool() {
      return {
        type: "function" as const,
        function: {
          name: definition.name,
          description: definition.description,
          parameters: toJSONSchema(definition.schema, definition.name)
        }
      };
    }
  };
}
