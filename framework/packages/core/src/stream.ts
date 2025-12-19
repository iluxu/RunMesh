import OpenAI from "openai";
import { ChatCompletionMessageToolCall } from "openai/resources/chat/completions";

export type StreamChunk = OpenAI.Chat.Completions.ChatCompletionChunk;
export type ToolCall = NonNullable<StreamChunk["choices"][number]["delta"]["tool_calls"]>[number];

export type StreamEvent =
  | { type: "token"; value: string }
  | { type: "tool_call"; toolCall: ToolCall }
  | { type: "final"; message: OpenAI.Chat.Completions.ChatCompletionMessage };

export class ResponseStream implements AsyncIterable<StreamEvent> {
  constructor(private readonly source: AsyncIterable<StreamChunk>) {}

  async *[Symbol.asyncIterator](): AsyncIterator<StreamEvent> {
    let assembled = "";
    const collectedToolCalls: ToolCall[] = [];

    for await (const chunk of this.source) {
      const choice = chunk.choices[0];
      if (!choice) continue;

      const contentDelta = choice.delta?.content;
      if (typeof contentDelta === "string") {
        assembled += contentDelta;
        yield { type: "token", value: contentDelta };
      } else if (Array.isArray(contentDelta)) {
        const text = (contentDelta as unknown[])
          .map((part: unknown) => {
            if (typeof part === "string") return part;
            if (
              typeof part === "object" &&
              part !== null &&
              "text" in (part as Record<string, unknown>)
            ) {
              return (part as { text?: string }).text ?? "";
            }
            return "";
          })
          .join("");
        if (text) {
          assembled += text;
          yield { type: "token", value: text };
        }
      }

      if (choice.delta?.tool_calls) {
        for (const call of choice.delta.tool_calls) {
          collectedToolCalls.push(call);
          yield { type: "tool_call", toolCall: call };
        }
      }

      if (choice.finish_reason && choice.finish_reason !== "length") {
        yield {
          type: "final",
          message: {
            role: "assistant",
            content: assembled,
            tool_calls: normalizeToolCalls(collectedToolCalls),
            refusal: null
          }
        };
      }
    }
  }

  async collectText(): Promise<string> {
    let fullText = "";
    for await (const event of this) {
      if (event.type === "token") {
        fullText += event.value;
      }
      if (event.type === "final" && typeof event.message.content === "string") {
        fullText = event.message.content;
      }
    }
    return fullText;
  }
}

function normalizeToolCalls(calls: ToolCall[]): ChatCompletionMessageToolCall[] | undefined {
  if (!calls.length) return undefined;
  return calls
    .map((call, idx) => {
      const fnName = call.function?.name ?? "unknown";
      const fnArgs = call.function?.arguments ?? "{}";
      return {
        id: call.id ?? `tool_${idx}`,
        function: { name: fnName, arguments: fnArgs },
        type: "function" as const
      };
    })
    .filter((call) => Boolean(call.function));
}
