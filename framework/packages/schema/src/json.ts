import { zodToJsonSchema } from "zod-to-json-schema";
import { ZodSchema } from "zod";

export function toJSONSchema<T>(schema: ZodSchema<T>, title?: string): Record<string, unknown> {
  const raw = zodToJsonSchema(schema, title) as Record<string, unknown>;
  return normalizeJsonSchema(raw);
}

function normalizeJsonSchema(schema: Record<string, unknown>): Record<string, unknown> {
  const ref = schema.$ref;
  const defs = schema.definitions;

  if (typeof ref === "string" && defs && typeof defs === "object") {
    const match = ref.match(/^#\/definitions\/(.+)$/);
    const name = match?.[1];
    if (name && (defs as Record<string, unknown>)[name]) {
      const resolved = (defs as Record<string, unknown>)[name] as Record<string, unknown>;
      return ensureObjectType(resolved);
    }
  }

  return ensureObjectType(schema);
}

function ensureObjectType(schema: Record<string, unknown>): Record<string, unknown> {
  if (!("type" in schema) && "properties" in schema) {
    return { ...schema, type: "object" };
  }
  return schema;
}
