import { describe, it, expect, vi } from "vitest";
import { parseStructuredOutput, generateStructuredOutput, buildJsonSchema } from "./response.js";
import { z } from "zod";
import { ValidationError } from "./errors.js";
import type { ChatResponse } from "./openai-client.js";

describe("response", () => {
  describe("parseStructuredOutput", () => {
    it("should parse valid JSON on first attempt", () => {
      const schema = z.object({ name: z.string(), age: z.number() });
      const response: ChatResponse = {
        id: "test",
        object: "chat.completion",
        created: Date.now(),
        model: "gpt-4",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: '{"name":"John","age":30}', refusal: null },
            finish_reason: "stop",
            logprobs: null
          }
        ]
      };

      const result = parseStructuredOutput(response, { schema, maxRetries: 1 });

      expect(result.value).toEqual({ name: "John", age: 30 });
      expect(result.retries).toBe(0);
    });

    it("should throw ValidationError on invalid JSON", () => {
      const schema = z.object({ name: z.string(), age: z.number() });
      const response: ChatResponse = {
        id: "test",
        object: "chat.completion",
        created: Date.now(),
        model: "gpt-4",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: '{"name":"John"}', refusal: null },
            finish_reason: "stop",
            logprobs: null
          }
        ]
      };

      expect(() => {
        parseStructuredOutput(response, { schema, maxRetries: 1 });
      }).toThrow(ValidationError);
    });

    it("should respect maxRetries count - 1 attempt with maxRetries=1", () => {
      const schema = z.object({ name: z.string() });
      const response: ChatResponse = {
        id: "test",
        object: "chat.completion",
        created: Date.now(),
        model: "gpt-4",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "invalid json", refusal: null },
            finish_reason: "stop",
            logprobs: null
          }
        ]
      };

      // With maxRetries=1, should make exactly 1 attempt then throw
      expect(() => {
        parseStructuredOutput(response, { schema, maxRetries: 1 });
      }).toThrow(ValidationError);
    });

    it("should handle array content format", () => {
      const schema = z.object({ message: z.string() });
      const response: ChatResponse = {
        id: "test",
        object: "chat.completion",
        created: Date.now(),
        model: "gpt-4",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: [{ type: "text", text: '{"message":"hello"}' }] as unknown as string,
              refusal: null
            },
            finish_reason: "stop",
            logprobs: null
          }
        ]
      };

      const result = parseStructuredOutput(response, { schema, maxRetries: 1 });

      expect(result.value).toEqual({ message: "hello" });
    });
  });

  describe("buildJsonSchema", () => {
    it("should convert Zod schema to JSON Schema", () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
        active: z.boolean()
      });

      const jsonSchema = buildJsonSchema(schema);

      expect(jsonSchema).toHaveProperty("type", "object");
      expect(jsonSchema).toHaveProperty("properties");
      expect(jsonSchema.properties).toHaveProperty("name");
      expect(jsonSchema.properties).toHaveProperty("age");
      expect(jsonSchema.properties).toHaveProperty("active");
    });

    it("should handle nested objects", () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          email: z.string()
        })
      });

      const jsonSchema = buildJsonSchema(schema);

      expect(jsonSchema).toHaveProperty("type", "object");
      expect(jsonSchema.properties).toHaveProperty("user");
    });

    it("should normalize schema with $ref", () => {
      const schema = z.object({
        items: z.array(z.string())
      });

      const jsonSchema = buildJsonSchema(schema);

      expect(jsonSchema).toHaveProperty("type", "object");
    });
  });

  describe("generateStructuredOutput", () => {
    it("should return parsed result on first successful attempt", async () => {
      const schema = z.object({ result: z.string() });
      const mockClient = {
        respond: vi.fn().mockResolvedValue({
          id: "test",
          object: "chat.completion",
          created: Date.now(),
          model: "gpt-4",
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: '{"result":"success"}' },
              finish_reason: "stop"
            }
          ]
        })
      };

      const result = await generateStructuredOutput({
        client: mockClient as any,
        request: { messages: [{ role: "user", content: "test" }] },
        schema,
        maxRetries: 2
      });

      expect(result.value).toEqual({ result: "success" });
      expect(mockClient.respond).toHaveBeenCalledTimes(1);
    });

    it("should retry on validation failure and eventually succeed", async () => {
      const schema = z.object({ result: z.string() });
      let attemptCount = 0;

      const mockClient = {
        respond: vi.fn().mockImplementation(() => {
          attemptCount++;
          if (attemptCount === 1) {
            // First attempt returns invalid
            return Promise.resolve({
              id: "test",
              object: "chat.completion",
              created: Date.now(),
              model: "gpt-4",
              choices: [
                {
                  index: 0,
                  message: { role: "assistant", content: "invalid json" },
                  finish_reason: "stop"
                }
              ]
            });
          }
          // Second attempt succeeds
          return Promise.resolve({
            id: "test",
            object: "chat.completion",
            created: Date.now(),
            model: "gpt-4",
            choices: [
              {
                index: 0,
                message: { role: "assistant", content: '{"result":"success"}' },
                finish_reason: "stop"
              }
            ]
          });
        })
      };

      const result = await generateStructuredOutput({
        client: mockClient as any,
        request: { messages: [{ role: "user", content: "test" }] },
        schema,
        maxRetries: 2
      });

      expect(result.value).toEqual({ result: "success" });
      expect(mockClient.respond).toHaveBeenCalledTimes(2);
    });

    it("should throw after exceeding maxRetries", async () => {
      const schema = z.object({ result: z.string() });
      const mockClient = {
        respond: vi.fn().mockResolvedValue({
          id: "test",
          object: "chat.completion",
          created: Date.now(),
          model: "gpt-4",
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: "always invalid" },
              finish_reason: "stop"
            }
          ]
        })
      };

      await expect(
        generateStructuredOutput({
          client: mockClient as any,
          request: { messages: [{ role: "user", content: "test" }] },
          schema,
          maxRetries: 2
        })
      ).rejects.toThrow(ValidationError);

      // With maxRetries=2, should make exactly 2 attempts
      expect(mockClient.respond).toHaveBeenCalledTimes(2);
    });
  });
});
