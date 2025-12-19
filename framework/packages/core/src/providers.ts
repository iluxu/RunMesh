/**
 * Multi-provider support for RunMesh
 * Supports OpenAI, OpenRouter, and any OpenAI-compatible API
 */

export type ModelProvider = "openai" | "openrouter" | "anthropic" | "custom";

export interface ProviderConfig {
  provider: ModelProvider;
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  headers?: Record<string, string>;
}

export const PROVIDER_CONFIGS: Record<ModelProvider, Partial<ProviderConfig>> = {
  openai: {
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o"
  },
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "anthropic/claude-3.5-sonnet",
    headers: {
      "HTTP-Referer": "https://runmesh.dev",
      "X-Title": "RunMesh"
    }
  },
  anthropic: {
    baseUrl: "https://api.anthropic.com/v1",
    defaultModel: "claude-3-5-sonnet-20241022"
  },
  custom: {}
};

/**
 * Get provider configuration with defaults
 */
export function getProviderConfig(provider: ModelProvider): Partial<ProviderConfig> {
  return PROVIDER_CONFIGS[provider] || PROVIDER_CONFIGS.custom;
}

/**
 * OpenRouter-specific model catalog
 * Access 200+ models through one API
 */
export const OPENROUTER_MODELS = {
  // Anthropic Claude
  "claude-3.5-sonnet": "anthropic/claude-3.5-sonnet",
  "claude-3-opus": "anthropic/claude-3-opus",
  "claude-3-sonnet": "anthropic/claude-3-sonnet",
  "claude-3-haiku": "anthropic/claude-3-haiku",

  // OpenAI
  "gpt-4o": "openai/gpt-4o",
  "gpt-4-turbo": "openai/gpt-4-turbo",
  "gpt-4": "openai/gpt-4",
  "gpt-3.5-turbo": "openai/gpt-3.5-turbo",

  // Google
  "gemini-pro": "google/gemini-pro",
  "gemini-pro-vision": "google/gemini-pro-vision",
  "gemini-2.0-flash-exp": "google/gemini-2.0-flash-exp",

  // Meta
  "llama-3.1-405b": "meta-llama/llama-3.1-405b-instruct",
  "llama-3.1-70b": "meta-llama/llama-3.1-70b-instruct",
  "llama-3.1-8b": "meta-llama/llama-3.1-8b-instruct",

  // Mistral
  "mistral-large": "mistralai/mistral-large",
  "mistral-medium": "mistralai/mistral-medium",
  "mixtral-8x7b": "mistralai/mixtral-8x7b-instruct",

  // Cohere
  "command-r-plus": "cohere/command-r-plus",
  "command-r": "cohere/command-r",

  // DeepSeek
  "deepseek-chat": "deepseek/deepseek-chat",
  "deepseek-coder": "deepseek/deepseek-coder"
} as const;

export type OpenRouterModel = keyof typeof OPENROUTER_MODELS;

/**
 * Helper to create OpenRouter configuration
 */
export function createOpenRouterConfig(apiKey: string, model?: OpenRouterModel): ProviderConfig {
  const config = getProviderConfig("openrouter");
  return {
    provider: "openrouter",
    apiKey,
    baseUrl: config.baseUrl!,
    defaultModel: model ? OPENROUTER_MODELS[model] : config.defaultModel,
    headers: config.headers
  };
}

/**
 * Helper to create OpenAI configuration
 */
export function createOpenAIConfig(apiKey: string, model?: string): ProviderConfig {
  const config = getProviderConfig("openai");
  return {
    provider: "openai",
    apiKey,
    baseUrl: config.baseUrl!,
    defaultModel: model || config.defaultModel
  };
}

/**
 * Helper to create custom provider configuration
 */
export function createCustomConfig(
  apiKey: string,
  baseUrl: string,
  defaultModel: string
): ProviderConfig {
  return {
    provider: "custom",
    apiKey,
    baseUrl,
    defaultModel
  };
}

/**
 * Auto-detect provider from environment or API key
 */
export function detectProvider(): ModelProvider {
  if (process.env.OPENROUTER_API_KEY) return "openrouter";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "openai"; // default
}

/**
 * Get provider config from environment
 */
export function getProviderFromEnv(): ProviderConfig | null {
  const provider = detectProvider();

  if (provider === "openrouter" && process.env.OPENROUTER_API_KEY) {
    return createOpenRouterConfig(process.env.OPENROUTER_API_KEY);
  }

  if (provider === "openai" && process.env.OPENAI_API_KEY) {
    return createOpenAIConfig(process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL || undefined);
  }

  if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    const config = getProviderConfig("anthropic");
    return {
      provider: "anthropic",
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseUrl: config.baseUrl!,
      defaultModel: config.defaultModel
    };
  }

  return null;
}
