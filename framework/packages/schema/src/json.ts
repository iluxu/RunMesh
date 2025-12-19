import { zodToJsonSchema } from "zod-to-json-schema";
import { ZodSchema } from "zod";

export function toJSONSchema<T>(schema: ZodSchema<T>, title?: string): Record<string, unknown> {
  return zodToJsonSchema(schema, title) as Record<string, unknown>;
}
