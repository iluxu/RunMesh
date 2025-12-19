import OpenAI, { ClientOptions } from "openai";
import {
  ChatCompletionCreateParams,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
  ChatCompletion,
  ChatCompletionMessageParam
} from "openai/resources/chat/completions";
import { ResponseStream, StreamChunk } from "./stream.js";
import { OpenAIRequestError } from "./errors.js";
import { ProviderConfig } from "./providers.js";

export type CreateOpenAIConfig = {
  apiKey?: string;
  defaultModel: string;
  baseURL?: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
};

/**
 * Create client from provider config
 */
export function createFromProvider(provider: ProviderConfig): RunMeshOpenAI {
  return createOpenAI({
    apiKey: provider.apiKey,
    defaultModel: provider.defaultModel || "gpt-4o",
    baseURL: provider.baseUrl,
    headers: provider.headers
  });
}

export type ChatMessage = ChatCompletionMessageParam;

export type ChatRequest = Omit<ChatCompletionCreateParams, "model" | "messages" | "stream"> & {
  model?: string;
  messages: ChatMessage[];
};

export type ChatResponse = ChatCompletion;

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
    const payload: ChatCompletionCreateParamsNonStreaming = {
      ...(request as ChatCompletionCreateParamsNonStreaming),
      model: request.model ?? config.defaultModel,
      messages: request.messages,
      stream: false
    };

    try {
      return await client.chat.completions.create(payload);
    } catch (error) {
      throw new OpenAIRequestError("OpenAI chat request failed", error);
    }
  }

  async function stream(request: ChatRequest): Promise<ResponseStream> {
    const payload: ChatCompletionCreateParamsStreaming = {
      ...(request as ChatCompletionCreateParamsStreaming),
      model: request.model ?? config.defaultModel,
      messages: request.messages,
      stream: true
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
  const options: ClientOptions = {
    apiKey: config.apiKey || process.env.OPENAI_API_KEY,
    baseURL: config.baseURL ?? process.env.OPENAI_BASE_URL,
    timeout: config.timeout ?? DEFAULT_TIMEOUT,
    maxRetries: config.retries ?? 0
  };

  // Add custom headers if provided (for OpenRouter, etc.)
  if (config.headers) {
    options.defaultHeaders = config.headers;
  }

  return options;
}
