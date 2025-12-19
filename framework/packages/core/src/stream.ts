import OpenAI from "openai";

export type StreamChunk = OpenAI.Chat.Completions.ChatCompletionChunk;

export type StreamEvent =
  | { type: "token"; value: string }
  | {
      type: "tool_call";
      toolCall: NonNullable<StreamChunk["choices"][number]["delta"]["tool_calls"]>[number];
    }
  | { type: "final"; message: OpenAI.Chat.Completions.ChatCompletionMessage };

export class ResponseStream implements AsyncIterable<StreamEvent> {
  constructor(private readonly source: AsyncIterable<StreamChunk>) {}

  async *[Symbol.asyncIterator](): AsyncIterator<StreamEvent> {
    let assembled = "";
    let role: OpenAI.Chat.Completions.ChatCompletionRole = "assistant";
    const collectedToolCalls: NonNullable<StreamChunk["choices"][number]["delta"]["tool_calls"]>[number][] = [];

    for await (const chunk of this.source) {
      const choice = chunk.choices[0];
      if (!choice) continue;

      if (choice.delta?.role) {
        role = choice.delta.role;
      }

      const contentDelta = choice.delta?.content;
      if (typeof contentDelta === "string") {
        assembled += contentDelta;
        yield { type: "token", value: contentDelta };
      } else if (Array.isArray(contentDelta)) {
        const text = contentDelta.map((part) => (typeof part === "string" ? part : part.text ?? "")).join("");
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
            role,
            content: assembled,
            tool_calls: collectedToolCalls.length ? collectedToolCalls : undefined
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
