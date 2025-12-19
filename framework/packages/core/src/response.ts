import { ZodSchema } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ValidationError } from "./errors.js";
import { RunMeshOpenAI, ChatRequest, ChatResponse } from "./openai-client.js";

export type StructuredResult<T> = {
  value: T;
  raw: string;
  retries: number;
};

export type StructuredOutputOptions<T> = {
  schema: ZodSchema<T>;
  maxRetries?: number;
};

export type StructuredGenerateOptions<T> = StructuredOutputOptions<T> & {
  request: ChatRequest;
  client: RunMeshOpenAI;
};

export function parseStructuredOutput<T>(
  response: ChatResponse,
  options: StructuredOutputOptions<T>
): StructuredResult<T> {
  const text = extractContent(response);
  const { schema, maxRetries = 1 } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const parsed = schema.parse(JSON.parse(text));
      return { value: parsed, raw: text, retries: attempt };
    } catch (error) {
      if (attempt === maxRetries) {
        throw new ValidationError("Unable to parse structured output", error);
      }
    }
  }

  throw new ValidationError("Structured output parsing failed unexpectedly");
}

export function buildJsonSchema<T>(schema: ZodSchema<T>): Record<string, unknown> {
  return zodToJsonSchema(schema, "StructuredOutput") as Record<string, unknown>;
}

export async function generateStructuredOutput<T>(
  options: StructuredGenerateOptions<T>
): Promise<StructuredResult<T>> {
  const { client, request, schema, maxRetries = 1 } = options;
  let retries = 0;
  let messages = request.messages;

  while (retries <= maxRetries) {
    const response = await client.respond({
      ...request,
      messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "structured_output",
          schema: buildJsonSchema(schema)
        }
      }
    });

    try {
      const parsed = parseStructuredOutput(response, { schema, maxRetries: 0 });
      return parsed;
    } catch (error) {
      retries += 1;
      if (retries > maxRetries) {
        throw error;
      }
      const content = [
        "The previous response was not valid JSON for the requested schema.",
        "Please return strictly valid JSON only.",
        "Schema expectation:",
        JSON.stringify(buildJsonSchema(schema))
      ].join("\n");
      messages = [...messages, { role: "user" as const, content }];
    }
  }

  throw new ValidationError("Structured output generation failed unexpectedly");
}

function extractContent(response: ChatResponse): string {
  const firstMessage = response.choices[0]?.message?.content;

  if (typeof firstMessage === "string") {
    return firstMessage;
  }

  if (Array.isArray(firstMessage)) {
    return (firstMessage as unknown[])
      .map((part: unknown) => {
        if (typeof part === "string") return part;
        if (typeof part === "object" && part !== null && "text" in (part as Record<string, unknown>)) {
          return (part as { text?: string }).text ?? "";
        }
        return "";
      })
      .join("");
  }

  throw new ValidationError("Response did not include text content");
}
