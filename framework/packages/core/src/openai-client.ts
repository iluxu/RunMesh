import OpenAI, { ClientOptions } from "openai";
import { ResponseStream, StreamChunk } from "./stream.js";
import { OpenAIRequestError } from "./errors.js";

export type CreateOpenAIConfig = {
  apiKey?: string;
  defaultModel: string;
  baseURL?: string;
  timeout?: number;
  retries?: number;
};

export type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

export type ChatRequest = {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  tools?: OpenAI.Chat.Completions.ChatCompletionTool[];
  tool_choice?: OpenAI.Chat.Completions.ChatCompletionToolChoiceOption;
  response_format?: OpenAI.Chat.Completions.ChatCompletionResponseFormat;
  metadata?: Record<string, unknown>;
};

export type ChatResponse = OpenAI.Chat.Completions.ChatCompletion;

export type RunMeshOpenAI = {
  client: OpenAI;
  respond(request: ChatRequest): Promise<ChatResponse>;
  stream(request: ChatRequest): Promise<ResponseStream>;
  withModel(model: string): RunMeshOpenAI;
};

const DEFAULT_TIMEOUT = 30_000;

export function createOpenAI(config: CreateOpenAIConfig): RunMeshOpenAI {
  const client = new OpenAI(buildClientOptions(config));

  async function respond(request: ChatRequest): Promise<ChatResponse> {
    const payload = {
      model: request.model ?? config.defaultModel,
      ...request
    };

    try {
      return await client.chat.completions.create(payload);
    } catch (error) {
      throw new OpenAIRequestError("OpenAI chat request failed", error);
    }
  }

  async function stream(request: ChatRequest): Promise<ResponseStream> {
    const payload = {
      model: request.model ?? config.defaultModel,
      stream: true,
      ...request
    };

    try {
      const iterator = await client.chat.completions.create(payload);
      return new ResponseStream(iterator as AsyncIterable<StreamChunk>);
    } catch (error) {
      throw new OpenAIRequestError("OpenAI streaming request failed", error);
    }
  }

  function withModel(model: string): RunMeshOpenAI {
    return createOpenAI({ ...config, defaultModel: model });
  }

  return { client, respond, stream, withModel };
}

function buildClientOptions(config: CreateOpenAIConfig): ClientOptions {
  return {
    apiKey: config.apiKey || process.env.OPENAI_API_KEY,
    baseURL: config.baseURL,
    timeout: config.timeout ?? DEFAULT_TIMEOUT,
    maxRetries: config.retries ?? 0
  };
}
